/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext } from 'vscode-azureextensionui';
import { ext } from '../extensionVariables';
import { StaticSiteTreeItem } from '../tree/StaticSiteTreeItem';

export async function deleteStaticSite(context: IActionContext, node?: StaticSiteTreeItem): Promise<void> {
    if (!node) {
        node = <StaticSiteTreeItem>await ext.tree.showTreeItemPicker(StaticSiteTreeItem.contextValue, context);
    }

    await node.deleteTreeItem(context);
}
