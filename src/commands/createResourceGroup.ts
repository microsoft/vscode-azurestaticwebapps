/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { window } from 'vscode';
import { IActionContext } from 'vscode-azureextensionui';
import { ext } from '../extensionVariables';
import { ResourceGroupTreeItem } from '../tree/ResourceGroupTreeItem';
import { SubscriptionTreeItem } from '../tree/SubscriptionTreeItem';
import { localize } from '../utils/localize';

export async function createResourceGroup(context: IActionContext, node?: SubscriptionTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<SubscriptionTreeItem>(SubscriptionTreeItem.contextValue, context);
    }

    const rgNode: ResourceGroupTreeItem = await node.createChild(context);

    // don't wait
    window.showInformationMessage(localize('createdRg', 'Created resource group "{0}".', rgNode.name));
}
