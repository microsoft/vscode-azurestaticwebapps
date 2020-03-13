/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { commands } from 'vscode';
import { AzureTreeItem, IActionContext, registerCommand } from 'vscode-azureextensionui';
import { ext } from '../extensionVariables';
import { createStaticWebApp } from './createStaticWebApp';
import { deleteResourceGroup } from './deleteResourceGroup';
import { openInPortal } from './openInPortal';
import { revealResource } from './revealResource';
import { viewProperties } from './viewProperties';

export function registerCommands(): void {
    registerCommand('azureMarmelade.createResourceGroup', createStaticWebApp);
    registerCommand('azureMarmelade.deleteResourceGroup', deleteResourceGroup);
    registerCommand('azureMarmelade.loadMore', async (context: IActionContext, node: AzureTreeItem) => await ext.tree.loadMore(node, context));
    registerCommand('azureMarmelade.openInPortal', openInPortal);
    registerCommand('azureMarmelade.refresh', async (_context: IActionContext, node?: AzureTreeItem) => await ext.tree.refresh(node));
    registerCommand('azureMarmelade.revealResource', revealResource);
    registerCommand('azureMarmelade.selectSubscriptions', () => commands.executeCommand('azure-account.selectSubscriptions'));
    registerCommand('azureMarmelade.viewProperties', viewProperties);
}
