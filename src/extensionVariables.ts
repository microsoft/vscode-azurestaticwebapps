/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ExtensionContext, TreeView } from "vscode";
import { AzExtTreeDataProvider, AzExtTreeItem, IAzExtOutputChannel, IAzureUserInput, IExperimentationServiceAdapter } from "vscode-azureextensionui";

/**
 * Namespace for common variables used throughout the extension. They must be initialized in the activate() method of extension.ts
 */
export namespace ext {
    export let context: ExtensionContext;
    export let tree: AzExtTreeDataProvider;
    export let treeView: TreeView<AzExtTreeItem>;
    export let outputChannel: IAzExtOutputChannel;
    export let ui: IAzureUserInput;
    export let ignoreBundle: boolean | undefined;
    export const prefix: string = 'staticWebApps';
    export let experimentationService: IExperimentationServiceAdapter;
}
