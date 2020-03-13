/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { window } from 'vscode';
import { IActionContext } from 'vscode-azureextensionui';
import { ext } from '../extensionVariables';
import { StaticSiteTreeItem } from '../tree/StaticSiteTreeItem';
import { SubscriptionTreeItem } from '../tree/SubscriptionTreeItem';
import { localize } from '../utils/localize';

export async function createStaticWebApp(context: IActionContext, node?: SubscriptionTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<SubscriptionTreeItem>(SubscriptionTreeItem.contextValue, context);
    }

    const ssNode: StaticSiteTreeItem = await node.createChild(context);

    // don't wait
    window.showInformationMessage(localize('createdRg', 'Created static site "{0}".', ssNode.name));
}
