/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { commands } from 'vscode';
import { AzureTreeItem, IActionContext, registerCommand } from 'vscode-azureextensionui';
import { ext } from '../extensionVariables';
import { createNewEndpoint } from './createNewEndpoint/createNewEndpoint';
import { createStaticSite } from './createStaticWebApp/createStaticSite';
import { deleteStaticSite } from './deleteStaticSite';
import { openInPortal } from './openInPortal';
import { revealResource } from './revealResource';
import { viewProperties } from './viewProperties';

export function registerCommands(): void {
    registerCommand('azureMarmelade.createStaticSite', createStaticSite);
    registerCommand('azureMarmelade.deleteStaticSite', deleteStaticSite);
    registerCommand('azureMarmelade.loadMore', async (context: IActionContext, node: AzureTreeItem) => await ext.tree.loadMore(node, context));
    registerCommand('azureMarmelade.openInPortal', openInPortal);
    registerCommand('azureMarmelade.refresh', async (_context: IActionContext, node?: AzureTreeItem) => await ext.tree.refresh(node));
    registerCommand('azureMarmelade.revealResource', revealResource);
    registerCommand('azureMarmelade.selectSubscriptions', () => commands.executeCommand('azure-account.selectSubscriptions'));
    registerCommand('azureMarmelade.viewProperties', viewProperties);
    registerCommand('azureMarmelade.createFunction', createNewEndpoint);
}
