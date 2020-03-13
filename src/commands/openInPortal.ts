/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as ui from 'vscode-azureextensionui';
import { ext } from '../extensionVariables';
import { ResourceTreeItem } from '../tree/ResourceTreeItem';
import { StaticSiteTreeItem } from '../tree/StaticSiteTreeItem';

export async function openInPortal(context: ui.IActionContext, node?: StaticSiteTreeItem | ResourceTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<StaticSiteTreeItem>(StaticSiteTreeItem.contextValue, context);
    }

    await ui.openInPortal(node.root, node.fullId);
}
