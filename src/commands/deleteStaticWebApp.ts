/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtTreeItem, DialogResponses, IActionContext } from '@microsoft/vscode-azext-utils';
import { DeleteResourceActivity } from '../activityLog/activities/DeleteResourceActivity';
import { ext } from '../extensionVariables';
import { ResolvedStaticWebAppTreeItem, StaticWebAppTreeItem } from '../tree/StaticWebAppTreeItem';
import { localize } from '../utils/localize';

export async function deleteStaticWebApp(context: IActionContext, node?: ResolvedStaticWebAppTreeItem & AzExtTreeItem): Promise<void> {
    if (!node) {
        node = await ext.rgApi.tree.showTreeItemPicker<ResolvedStaticWebAppTreeItem & AzExtTreeItem>(new RegExp(StaticWebAppTreeItem.contextValue), { ...context, suppressCreatePick: true });
    }

    const confirmMessage: string = localize('deleteConfirmation', 'Are you sure you want to delete static web app "{0}"?', node.name);
    await context.ui.showWarningMessage(confirmMessage, { modal: true }, DialogResponses.deleteResponse);

    await ext.rgApi.registerActivity(new DeleteResourceActivity({
        resourceName: node.name,
        resourceTypeDisplayName: 'static web app'
    }, async () => await node?.deleteTreeItem(context)))
}
