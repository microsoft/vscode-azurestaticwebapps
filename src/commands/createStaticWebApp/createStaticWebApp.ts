/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { MessageItem, window } from 'vscode';
import { IActionContext, ICreateChildImplContext } from 'vscode-azureextensionui';
import { showActionsMsg } from '../../constants';
import { ext } from '../../extensionVariables';
import { StaticWebAppTreeItem } from '../../tree/StaticWebAppTreeItem';
import { SubscriptionTreeItem } from '../../tree/SubscriptionTreeItem';
import { localize } from '../../utils/localize';
import { showActions } from '../github/showActions';
import { postCreateStaticWebApp } from './postCreateStaticWebApp';

export async function createStaticWebApp(context: IActionContext & Partial<ICreateChildImplContext>, node?: SubscriptionTreeItem): Promise<StaticWebAppTreeItem> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<SubscriptionTreeItem>(SubscriptionTreeItem.contextValue, context);
    }

    const swaNode: StaticWebAppTreeItem = await node.createChild(context);

    const createdSs: string = localize('createdSs', 'Successfully created new static web app "{0}".  GitHub Actions is building and deploying your app, it will be available once the deployment completes.', swaNode.name);
    ext.outputChannel.appendLog(createdSs);

    const viewOutput: MessageItem = { title: localize('viewOutput', 'View Output') };
    // don't wait
    window.showInformationMessage(createdSs, showActionsMsg, viewOutput).then(async (result) => {
        if (result === showActionsMsg) {
            await showActions(context, swaNode);
        } else if (result === viewOutput) {
            ext.outputChannel.show();
        }
    });

    // tslint:disable-next-line: no-floating-promises
    postCreateStaticWebApp(swaNode);

    return swaNode;
}

export async function createStaticWebAppAdvanced(context: IActionContext, node?: SubscriptionTreeItem): Promise<StaticWebAppTreeItem> {
    return await createStaticWebApp({ ...context, advancedCreation: true }, node);
}
