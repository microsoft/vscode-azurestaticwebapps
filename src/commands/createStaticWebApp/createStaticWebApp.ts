/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ProgressLocation, ProgressOptions, window, WorkspaceFolder } from 'vscode';
import { IActionContext, ICreateChildImplContext } from 'vscode-azureextensionui';
import { productionEnvironmentName } from '../../constants';
import { ext } from '../../extensionVariables';
import { EnvironmentTreeItem } from '../../tree/EnvironmentTreeItem';
import { StaticWebAppTreeItem } from '../../tree/StaticWebAppTreeItem';
import { SubscriptionTreeItem } from '../../tree/SubscriptionTreeItem';
import { getGitWorkspaceState, gitPull, GitWorkspaceState, VerifiedGitWorkspaceState, verifyGitWorkspaceForCreation, warnIfNotOnDefaultBranch } from '../../utils/gitUtils';
import { localize } from '../../utils/localize';
import { nonNullProp } from '../../utils/nonNull';
import { getWorkspaceFolder } from '../../utils/workspaceUtils';
import { showSwaCreated } from '../showSwaCreated';
import { GitHubOrgListStep } from './GitHubOrgListStep';
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
        const folder: WorkspaceFolder = await getWorkspaceFolder(context);
        const gitWorkspaceState: GitWorkspaceState = await getGitWorkspaceState(context, folder.uri);
        const verifiedWorkspace: VerifiedGitWorkspaceState = await verifyGitWorkspaceForCreation(context, gitWorkspaceState, folder.uri);

        await warnIfNotOnDefaultBranch(context, verifiedWorkspace);
        context.telemetry.properties.cancelStep = undefined;

        context.fsPath = folder.uri.fsPath;
        context.repo = verifiedWorkspace.repo;

        if (gitWorkspaceState.remoteRepo) {
            context.repoHtmlUrl = gitWorkspaceState.remoteRepo.html_url;
            context.branchData = { name: gitWorkspaceState.remoteRepo.default_branch };
        } else {
            if (!context.advancedCreation) {
                // default repo to private for basic create
                context.newRepoIsPrivate = true;
                // set the org to the authenticated user for creation
                context.orgData = await GitHubOrgListStep.getAuthenticatedUser(context);
            }
        }

        await setWorkspaceContexts(context, context.fsPath);
    });

    const swaNode: StaticWebAppTreeItem = await node.createChild(context);

    await gitPull(nonNullProp(context, 'repo'));
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
