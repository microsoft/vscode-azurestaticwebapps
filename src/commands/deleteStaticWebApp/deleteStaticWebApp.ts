/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtTreeItem, IActionContext } from '@microsoft/vscode-azext-utils';
import { ext } from '../../extensionVariables';
import { ResolvedStaticWebAppTreeItem, StaticWebAppTreeItem } from '../../tree/StaticWebAppTreeItem';

export async function deleteStaticWebApp(context: IActionContext, node?: ResolvedStaticWebAppTreeItem & AzExtTreeItem): Promise<void> {
    if (!node) {
        node = await ext.rgApi.appResourceTree.showTreeItemPicker<ResolvedStaticWebAppTreeItem & AzExtTreeItem>(new RegExp(StaticWebAppTreeItem.contextValue), { ...context, suppressCreatePick: true });
    }

    await node.deleteTreeItem(context);
}
