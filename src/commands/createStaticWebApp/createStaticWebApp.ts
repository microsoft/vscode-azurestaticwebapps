/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { MessageItem, window } from 'vscode';
import { IActionContext } from 'vscode-azureextensionui';
import { ext } from '../../extensionVariables';
import { StaticWebAppTreeItem } from '../../tree/StaticWebAppTreeItem';
import { SubscriptionTreeItem } from '../../tree/SubscriptionTreeItem';
import { localize } from '../../utils/localize';
import { openUrl } from '../../utils/openUrl';

export async function createStaticWebApp(context: IActionContext, node?: SubscriptionTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<SubscriptionTreeItem>(SubscriptionTreeItem.contextValue, context);
    }

    const ssNode: StaticWebAppTreeItem = await node.createChild(context);

    const createdSs: string = localize('createdSs', 'Created static site "{0}".', ssNode.name);
    ext.outputChannel.appendLog(createdSs);

    const showActions: MessageItem = { title: 'Show Actions' };
    // don't wait
    window.showInformationMessage(createdSs, showActions).then(async (result) => {
        if (result === showActions) {
            await openUrl(`${ssNode.data.properties.repositoryUrl}/actions`);
        }
    });

}
