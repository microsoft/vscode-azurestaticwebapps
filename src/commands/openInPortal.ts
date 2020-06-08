/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AppSettingsTreeItem } from 'vscode-azureappservice';
import * as ui from 'vscode-azureextensionui';
import { ext } from '../extensionVariables';
import { FunctionsTreeItem } from '../tree/FunctionsTreeItem';
import { StaticWebAppTreeItem } from '../tree/StaticWebAppTreeItem';

export async function openInPortal(context: ui.IActionContext, node?: ui.AzureTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<StaticWebAppTreeItem>(StaticWebAppTreeItem.contextValue, context);
    }

    switch (node.contextValue) {
        // since the parents of AppSettings & Functions are always an Environment, we need to get the parent.parent to use the SWA id
        case AppSettingsTreeItem.contextValue:
            await ui.openInPortal((<StaticWebAppTreeItem>node.parent?.parent).root, `${node.parent?.parent?.fullId}/configurations`);
            return;
        case FunctionsTreeItem.contextValue:
            await ui.openInPortal(node.root, `${node.parent?.parent?.fullId}/${node.id}`);
            return;
        default:
            await ui.openInPortal(node.root, node.fullId);
            return;
    }

}
