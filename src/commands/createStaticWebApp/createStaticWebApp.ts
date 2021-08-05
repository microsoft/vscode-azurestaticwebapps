/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ProgressLocation, ProgressOptions, window } from 'vscode';
import { IActionContext, ICreateChildImplContext } from 'vscode-azureextensionui';
import { cloneProjectMsg, openExistingProject, openExistingProjectMsg, productionEnvironmentName } from '../../constants';
import { NoWorkspaceError } from '../../errors';
import { ext } from '../../extensionVariables';
import { EnvironmentTreeItem } from '../../tree/EnvironmentTreeItem';
import { StaticWebAppTreeItem } from '../../tree/StaticWebAppTreeItem';
import { SubscriptionTreeItem } from '../../tree/SubscriptionTreeItem';
import { localize } from '../../utils/localize';
import { openFolder, showNoWorkspacePrompt, tryGetWorkspaceFolder } from '../../utils/workspaceUtils';
import { cloneRepo } from '../github/cloneRepo';
import { showSwaCreated } from '../showSwaCreated';
import { IStaticWebAppWizardContext } from './IStaticWebAppWizardContext';
import { postCreateStaticWebApp } from './postCreateStaticWebApp';
import { setWorkspaceContexts } from './setWorkspaceContexts';

export async function createStaticWebApp(context: IActionContext & Partial<ICreateChildImplContext> & Partial<IStaticWebAppWizardContext>, node?: SubscriptionTreeItem): Promise<StaticWebAppTreeItem> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<SubscriptionTreeItem>(SubscriptionTreeItem.contextValue, context);
    }

    const progressOptions: ProgressOptions = {
        location: ProgressLocation.Notification,
        title: localize('verifyingWorkspace', 'Verifying workspace...')
    };
    await window.withProgress(progressOptions, async () => {
        const folder = await tryGetWorkspaceFolder(context);
        if (folder) {
            await setWorkspaceContexts(context, folder);
        } else {
            const result = await showNoWorkspacePrompt(context);

            if (result === cloneProjectMsg) {
                await cloneRepo(context, '');
                context.telemetry.properties.noWorkspaceResult = 'cloneProject';
            } else if (result === openExistingProjectMsg) {
                await openFolder(context)
                context.telemetry.properties.noWorkspaceResult = openExistingProject;
            }
            context.errorHandling.suppressDisplay = true;
            throw new NoWorkspaceError();
        }
    });

    const swaNode: StaticWebAppTreeItem = await node.createChild(context);
    void showSwaCreated(swaNode);

    const environmentNode: EnvironmentTreeItem | undefined = <EnvironmentTreeItem | undefined>(await swaNode.loadAllChildren(context)).find(ti => {
        return ti instanceof EnvironmentTreeItem && ti.label === productionEnvironmentName;
    });
    environmentNode && await ext.treeView.reveal(environmentNode, { expand: true });

    void postCreateStaticWebApp(swaNode);
    return swaNode;
}

export async function createStaticWebAppAdvanced(context: IActionContext, node?: SubscriptionTreeItem): Promise<StaticWebAppTreeItem> {
    return await createStaticWebApp({ ...context, advancedCreation: true }, node);
}
