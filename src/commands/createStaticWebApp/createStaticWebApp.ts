/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { MessageItem, window } from 'vscode';
import { callWithTelemetryAndErrorHandling, IActionContext } from 'vscode-azureextensionui';
import { ext } from '../../extensionVariables';
import { StaticWebAppTreeItem } from '../../tree/StaticWebAppTreeItem';
import { SubscriptionTreeItem } from '../../tree/SubscriptionTreeItem';
import { localize } from '../../utils/localize';
import { cloneRepo } from '../github/cloneRepo';
import { showActions } from '../github/showActions';

export async function createStaticWebApp(context: IActionContext, node?: SubscriptionTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<SubscriptionTreeItem>(SubscriptionTreeItem.contextValue, context);
    }

    const ssNode: StaticWebAppTreeItem = await node.createChild(context);

    const createdSs: string = localize('createdSs', 'Created static web app "{0}".', ssNode.name);
    ext.outputChannel.appendLog(createdSs);

    const showActionsMsg: MessageItem = { title: 'Show Actions' };
    const cloneRepoMsg: MessageItem = { title: localize('cloneRepo', 'Clone Repo') };
    const msgItems: MessageItem[] = [showActionsMsg];

    if (context.telemetry.properties.gotRemote === 'false') {
        // only ask to clone if we didn't detect the remote for creation
        msgItems.unshift(cloneRepoMsg);
    }

    // don't wait
    window.showInformationMessage(createdSs, ...msgItems).then(async (result) => {
        await callWithTelemetryAndErrorHandling('postCreateStaticWebApp', async (context2: IActionContext) => {
            context2.telemetry.properties.dialogResult = result?.title;
            if (result === showActionsMsg) {
                await showActions(context2, ssNode);
            } else if (result === cloneRepoMsg) {
                await cloneRepo(context2, ssNode);
            }
        });
    });

}
