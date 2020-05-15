/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as ui from 'vscode-azureextensionui';
import { ext } from '../extensionVariables';
import { AppSettingsTreeItem } from '../tree/AppSettingsTreeItem';
import { EnvironmentTreeItem } from '../tree/EnvironmentTreeItem';
import { StaticWebAppTreeItem } from '../tree/StaticWebAppTreeItem';

export async function openInPortal(context: ui.IActionContext, node?: ui.AzureTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<StaticWebAppTreeItem>(StaticWebAppTreeItem.contextValue, context);
    }

    switch (node.contextValue) {
        // the deep link for App Settings is the ${swa.id}/configurations, however if the entry point was a build's configurations, the link is broken
        case AppSettingsTreeItem.contextValue:
            if (node.parent instanceof EnvironmentTreeItem) {
                node = <StaticWebAppTreeItem>node.parent.parent;
                await ui.openInPortal(node.root, `${node.fullId}/configurations`);
                return;
            }
        // fall down to default case
        default:
            await ui.openInPortal(node.root, node.fullId);
            return;
    }

}
