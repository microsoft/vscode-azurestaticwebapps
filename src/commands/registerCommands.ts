/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { commands } from 'vscode';
import { AzureTreeItem, IActionContext, registerCommand } from 'vscode-azureextensionui';
import { ext } from '../extensionVariables';
import { browse } from './browse';
import { createNewEndpoint } from './createNewEndpoint/createNewEndpoint';
import { createStaticWebApp } from './createStaticWebApp/createStaticWebApp';
import { deleteStaticWebApp } from './deleteStaticWebApp';
import { openInPortal } from './openInPortal';
import { showActions } from './showActions';
import { viewProperties } from './viewProperties';

export function registerCommands(): void {
    registerCommand('staticWebApps.createStaticWebApp', createStaticWebApp);
    registerCommand('staticWebApps.deleteStaticWebApp', deleteStaticWebApp);
    registerCommand('staticWebApps.loadMore', async (context: IActionContext, node: AzureTreeItem) => await ext.tree.loadMore(node, context));
    registerCommand('staticWebApps.openInPortal', openInPortal);
    registerCommand('staticWebApps.refresh', async (_context: IActionContext, node?: AzureTreeItem) => await ext.tree.refresh(node));
    registerCommand('staticWebApps.selectSubscriptions', () => commands.executeCommand('azure-account.selectSubscriptions'));
    registerCommand('staticWebApps.viewProperties', viewProperties);
    registerCommand('staticWebApps.createNewEndpoint', createNewEndpoint);
    registerCommand('staticWebApps.browse', browse);
    registerCommand('staticWebApps.showActions', showActions);
}
