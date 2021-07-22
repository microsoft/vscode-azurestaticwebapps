/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as vscode from 'vscode';
import { registerAppServiceExtensionVariables } from 'vscode-azureappservice';
import { AzExtTreeDataProvider, callWithTelemetryAndErrorHandling, createApiProvider, createAzExtOutputChannel, createExperimentationService, IActionContext, registerUIExtensionVariables } from 'vscode-azureextensionui';
import { AzureExtensionApi, AzureExtensionApiProvider } from 'vscode-azureextensionui/api';
import { revealTreeItem } from './commands/api/revealTreeItem';
import { registerCommands } from './commands/registerCommands';
import { githubAuthProviderId, githubScopes } from './constants';
import { ext } from './extensionVariables';
import { AzureAccountTreeItem } from './tree/AzureAccountTreeItemWithProjects';

export async function activateInternal(context: vscode.ExtensionContext, perfStats: { loadStartTime: number; loadEndTime: number }, ignoreBundle?: boolean): Promise<AzureExtensionApiProvider> {
    ext.context = context;
    ext.ignoreBundle = ignoreBundle;
    ext.outputChannel = createAzExtOutputChannel('Azure Static Web Apps', ext.prefix);
    context.subscriptions.push(ext.outputChannel);

    registerAppServiceExtensionVariables(ext);
    registerUIExtensionVariables(ext);

    await callWithTelemetryAndErrorHandling('staticWebApps.activate', async (activateContext: IActionContext) => {
        activateContext.telemetry.properties.isActivationEvent = 'true';
        activateContext.telemetry.measurements.mainFileLoad = (perfStats.loadEndTime - perfStats.loadStartTime) / 1000;

        /**
         * By passing `createIfNone: false`, a numbered badge will show up on the accounts activity bar icon.
         * An entry for the extension will be added under the menu to sign in.
         */
        await vscode.authentication.getSession(githubAuthProviderId, githubScopes, { createIfNone: false });

        const accountTreeItem: AzureAccountTreeItem = new AzureAccountTreeItem();
        context.subscriptions.push(accountTreeItem);
        ext.tree = new AzExtTreeDataProvider(accountTreeItem, 'staticWebApps.loadMore');
        ext.treeView = vscode.window.createTreeView('staticWebApps', { treeDataProvider: ext.tree, showCollapseAll: true, canSelectMany: true });
        context.subscriptions.push(ext.treeView);

        registerCommands();

        ext.experimentationService = await createExperimentationService(context);
    });

    return createApiProvider([<AzureExtensionApi>{
        revealTreeItem,
        apiVersion: '1.0.0'
    }]);
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivateInternal(): void {
}
