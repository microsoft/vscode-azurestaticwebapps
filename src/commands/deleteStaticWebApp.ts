/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtTreeItem, DialogResponses, IActionContext } from '@microsoft/vscode-azext-utils';
import { ext } from '../extensionVariables';
import { ResolvedStaticWebAppTreeItem, StaticWebAppTreeItem } from '../tree/StaticWebAppTreeItem';
import { localize } from '../utils/localize';

export async function deleteStaticWebApp(context: IActionContext, node?: ResolvedStaticWebAppTreeItem & AzExtTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<ResolvedStaticWebAppTreeItem & AzExtTreeItem>(StaticWebAppTreeItem.contextValue, { ...context, suppressCreatePick: true });
    }

    const confirmMessage: string = localize('deleteConfirmation', 'Are you sure you want to delete static web app "{0}"?', node.name);
    await context.ui.showWarningMessage(confirmMessage, { modal: true }, DialogResponses.deleteResponse);
    await node.deleteTreeItem(context);
}
