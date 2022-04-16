/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { UserCancelledError } from "@microsoft/vscode-azext-utils";
import { CancellationToken, CancellationTokenSource } from "vscode";
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
