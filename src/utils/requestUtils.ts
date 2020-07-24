/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { HttpMethods, IncomingMessage, ServiceClientCredentials, WebResource } from "ms-rest";
import * as requestP from 'request-promise';
import { appendExtensionUserAgent, ISubscriptionContext } from "vscode-azureextensionui";
import { delay } from "./delay";

export namespace requestUtils {
    export type Request = WebResource & requestP.RequestPromiseOptions;
    type AzureAsyncOperationResponse = {
        id?: string;
        status: string;
        error?: {
            code: string;
            message: string;
        };
    };

    export async function getDefaultRequest(url: string, credentials?: ServiceClientCredentials, method: HttpMethods = 'GET'): Promise<Request> {
        const request: WebResource = new WebResource();
        request.url = url;
        request.method = method;
        request.headers = {
            ['User-Agent']: appendExtensionUserAgent()
        };

        if (credentials) {
            await signRequest(request, credentials);
        }

        return request;
    }

    export async function getDefaultAzureRequest(urlPath: string, root: ISubscriptionContext, method: HttpMethods = 'GET'): Promise<Request> {
        let baseUrl: string = root.environment.resourceManagerEndpointUrl;
        if (baseUrl.endsWith('/')) {
            baseUrl = baseUrl.slice(0, -1);
        }

        if (!urlPath.startsWith('/')) {
            urlPath = `/${urlPath}`;
        }

        return getDefaultRequest(baseUrl + urlPath, root.credentials, method);
    }

    export async function sendRequest<T>(request: Request): Promise<T> {
        return await <Thenable<T>>requestP(request).promise();
    }

    export async function signRequest(request: Request, cred: ServiceClientCredentials): Promise<void> {
        await new Promise((resolve, reject): void => {
            cred.signRequest(request, (err: Error | undefined) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    //https://docs.microsoft.com/en-us/azure/azure-resource-manager/management/async-operations
    export async function pollAzureAsyncOperation(asyncOperationRequest: Request, cred: ServiceClientCredentials): Promise<void> {
        asyncOperationRequest.resolveWithFullResponse = true;
        const asyncAzureRes: IncomingMessage = await sendRequest(asyncOperationRequest);
        const monitorStatusUrl: string = <string>asyncAzureRes.headers['azure-asyncoperation'];
        // the url already includes resourceManagerEndpointUrl, so just use getDefaultRequest instead
        const monitorStatusReq: Request = await getDefaultRequest(monitorStatusUrl, cred);

        const timeoutInSeconds: number = 60;
        const maxTime: number = Date.now() + timeoutInSeconds * 1000;
        while (Date.now() < maxTime) {
            const statusJsonString: string = await sendRequest(monitorStatusReq);
            let operationResponse: AzureAsyncOperationResponse | undefined;
            try {
                operationResponse = <AzureAsyncOperationResponse>JSON.parse(statusJsonString);
            } catch {
                // swallow JSON parsing errors
            }

            if (operationResponse?.status !== 'InProgress') {
                if (operationResponse?.error) {
                    throw operationResponse.error;
                }
                return;
            }

            await delay(2000);
        }
    }
}
