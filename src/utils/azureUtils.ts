/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as msRest from "@azure/ms-rest-js";
import { CancellationToken, CancellationTokenSource } from "vscode";
import { createGenericClient, IActionContext, ISubscriptionContext, UserCancelledError } from "vscode-azureextensionui";
import { delay } from "./delay";
import { localize } from './localize';

function parseResourceId(id: string): RegExpMatchArray {
    const matches: RegExpMatchArray | null = id.match(/\/subscriptions\/(.*)\/resourceGroups\/(.*)\/providers\/(.*)\/(.*)/);

    if (matches === null || matches.length < 3) {
        throw new Error(localize('InvalidResourceId', 'Invalid Azure Resource Id'));
    }

    return matches;
}

export function getResourceGroupFromId(id: string): string {
    return parseResourceId(id)[2];
}

type AzureAsyncOperationResponse = {
    id?: string;
    status: string;
    error?: {
        code: string;
        message: string;
    };
};

const activeAsyncTokens: { [key: string]: CancellationTokenSource | undefined } = {};
export async function pollAsyncOperation(pollingOperation: () => Promise<boolean>, pollIntervalInSeconds: number, timeoutInSeconds: number, id: string): Promise<boolean> {
    const tokenSource: CancellationTokenSource = new CancellationTokenSource();
    const token: CancellationToken = tokenSource.token;
    if (activeAsyncTokens[id]) {
        activeAsyncTokens[id]?.cancel();
    }

    activeAsyncTokens[id] = tokenSource;
    const maxTime: number = Date.now() + timeoutInSeconds * 1000;
    let pollingComplete: boolean = false;
    try {
        while (!pollingComplete && Date.now() < maxTime) {
            if (token.isCancellationRequested) {
                throw new UserCancelledError(`pollAsyncOperation`);
            }

            pollingComplete = await pollingOperation();
            if (!pollingComplete) {
                await delay(pollIntervalInSeconds * 1000);
            }
        }

        return pollingComplete;
    } finally {
        if (!token.isCancellationRequested) {
            // only clear the token if it wasn't canceled (it gets overwritten with the new one)
            activeAsyncTokens[id] = undefined;
        }

        tokenSource.dispose();
    }
}

//https://docs.microsoft.com/en-us/azure/azure-resource-manager/management/async-operations
export async function pollAzureAsyncOperation(context: IActionContext, restResponse: msRest.RestResponse, subscription: ISubscriptionContext): Promise<void> {
    const url: string | undefined = restResponse._response.headers.get('azure-asyncoperation');
    if (!url) {
        // if there is no asyncoperation url, just return as the delete was still initiated
        return;
    }

    const request: msRest.WebResource = new msRest.WebResource();
    request.prepare({ method: 'GET', url });

    const client: msRest.ServiceClient = await createGenericClient(context, subscription);
    const pollingOperation: () => Promise<boolean> = async () => {
        const statusJsonString: msRest.HttpOperationResponse = await client.sendRequest(request);
        const operationResponse: AzureAsyncOperationResponse | undefined = <AzureAsyncOperationResponse>statusJsonString.parsedBody;
        if (operationResponse?.status !== 'InProgress') {
            if (operationResponse?.error) {
                throw operationResponse.error;
            }

            return true;
        }

        return false;
    };

    await pollAsyncOperation(pollingOperation, 2, 60, url);
}
