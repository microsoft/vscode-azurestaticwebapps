/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { EventEmitter, ProgressLocation, ProgressOptions, window } from 'vscode';
import { IActionContext, ICreateChildImplContext } from 'vscode-azureextensionui';
import { productionEnvironmentName } from '../../constants';
import { VerifyingWorkspaceError } from '../../errors';
import { ext } from '../../extensionVariables';
import { EnvironmentTreeItem } from '../../tree/EnvironmentTreeItem';
import { StaticWebAppTreeItem } from '../../tree/StaticWebAppTreeItem';
import { SubscriptionTreeItem } from '../../tree/SubscriptionTreeItem';
import { localize } from '../../utils/localize';
import { showNoWorkspacePrompt, tryGetWorkspaceFolder } from '../../utils/workspaceUtils';
import { showSwaCreated } from '../showSwaCreated';
import { IStaticWebAppWizardContext } from './IStaticWebAppWizardContext';
import { postCreateStaticWebApp } from './postCreateStaticWebApp';
import { setWorkspaceContexts } from './setWorkspaceContexts';

export const isVerifyingWorkspaceEmitter: EventEmitter<boolean> = new EventEmitter<boolean>()
let _isVerifyingWorkspace: boolean = false;

isVerifyingWorkspaceEmitter.event(e => _isVerifyingWorkspace = e);

export async function createStaticWebApp(context: IActionContext & Partial<ICreateChildImplContext> & Partial<IStaticWebAppWizardContext>, node?: SubscriptionTreeItem): Promise<StaticWebAppTreeItem> {
    if (_isVerifyingWorkspace) {
        throw new VerifyingWorkspaceError(context);
    }

    isVerifyingWorkspaceEmitter.fire(true);

    if (!node) {
        node = await ext.tree.showTreeItemPicker<SubscriptionTreeItem>(SubscriptionTreeItem.contextValue, context);
    }

    const progressOptions: ProgressOptions = {
        location: ProgressLocation.Notification,
        title: localize('verifyingWorkspace', 'Verifying workspace...')
    };

    try {
        await window.withProgress(progressOptions, async () => {
            const folder = await tryGetWorkspaceFolder(context);
            if (folder) {
                await setWorkspaceContexts(context, folder);
            } else {
                await showNoWorkspacePrompt(context);
            }
        })

        const swaNode: StaticWebAppTreeItem = await node.createChild(context);
        void showSwaCreated(swaNode);

        const environmentNode: EnvironmentTreeItem | undefined = <EnvironmentTreeItem | undefined>(await swaNode.loadAllChildren(context)).find(ti => {
            return ti instanceof EnvironmentTreeItem && ti.label === productionEnvironmentName;
        });
        environmentNode && await ext.treeView.reveal(environmentNode, { expand: true });

        void postCreateStaticWebApp(swaNode);
        return swaNode;;
    } finally {
        isVerifyingWorkspaceEmitter.fire(false);
    }
}

export async function createStaticWebAppAdvanced(context: IActionContext, node?: SubscriptionTreeItem): Promise<StaticWebAppTreeItem> {
    return await createStaticWebApp({ ...context, advancedCreation: true }, node);
}
