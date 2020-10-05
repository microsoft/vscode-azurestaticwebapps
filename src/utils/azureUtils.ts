/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as msRest from "@azure/ms-rest-js";
import { createGenericClient } from "vscode-azureextensionui";
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

//https://docs.microsoft.com/en-us/azure/azure-resource-manager/management/async-operations
export async function pollAzureAsyncOperation(restResponse: msRest.RestResponse, credentials: msRest.ServiceClientCredentials): Promise<void> {
    const url: string | undefined = restResponse._response.headers.get('azure-asyncoperation');
    if (!url) {
        // if there is no asyncoperation url, just return as the delete was still initiated
        return;
    }

    const request: msRest.WebResource = new msRest.WebResource();
    request.prepare({ method: 'GET', url });
    await credentials.signRequest(request);

    const timeoutInSeconds: number = 60;
    const maxTime: number = Date.now() + timeoutInSeconds * 1000;
    const client: msRest.ServiceClient = createGenericClient();
    while (Date.now() < maxTime) {
        const statusJsonString: msRest.HttpOperationResponse = await client.sendRequest(request);
        const operationResponse: AzureAsyncOperationResponse | undefined = <AzureAsyncOperationResponse>statusJsonString.parsedBody;
        if (operationResponse?.status !== 'InProgress') {
            if (operationResponse?.error) {
                throw operationResponse.error;
            }

            return;
        }

        await delay(2000);
    }
}
