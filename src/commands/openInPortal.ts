/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AppSettingsTreeItem } from '@microsoft/vscode-azext-azureappservice';
import { openInPortal as openInPortalUtil } from '@microsoft/vscode-azext-azureutils';
import { AzExtTreeItem, IActionContext } from '@microsoft/vscode-azext-utils';
import { ext } from '../extensionVariables';
import { FunctionsTreeItem } from '../tree/FunctionsTreeItem';
import { StaticWebAppTreeItem } from '../tree/StaticWebAppTreeItem';

export async function openInPortal(context: IActionContext, node?: AzExtTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<StaticWebAppTreeItem>(StaticWebAppTreeItem.contextValue, context);
    }

    switch (node.contextValue) {
        // since the parents of AppSettings & Functions are always an Environment, we need to get the parent.parent to use the SWA id
        case AppSettingsTreeItem.contextValue:
            await openInPortalUtil(node, `${node.parent?.parent?.fullId}/configurations`);
            return;
        case FunctionsTreeItem.contextValue:
            await openInPortalUtil(node, `${node.parent?.parent?.fullId}/${node.id}`);
            return;
        default:
            await openInPortalUtil(node, node.fullId);
            return;
    }

}
