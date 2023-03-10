/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IAzExtOutputChannel, IExperimentationServiceAdapter } from "@microsoft/vscode-azext-utils";
import { AzureHostExtensionApi } from "@microsoft/vscode-azext-utils/hostapi";
import { ExtensionContext } from "vscode";
import { RemoteRepoApi } from "./RemoteRepoApi";
import { GitAPI } from "./git";

/**
 * Namespace for common variables used throughout the extension. They must be initialized in the activate() method of extension.ts
 */
export namespace ext {
    export let context: ExtensionContext;
    export let outputChannel: IAzExtOutputChannel;
    export let ignoreBundle: boolean | undefined;
    export const prefix: string = 'staticWebApps';
    export let experimentationService: IExperimentationServiceAdapter;
    export let rgApi: AzureHostExtensionApi;
    export let remoteRepoApi: RemoteRepoApi;
    export let vscodeGitApi: GitAPI;
}
