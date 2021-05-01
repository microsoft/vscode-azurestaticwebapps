/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { MessageItem, window, WorkspaceFolder } from 'vscode';
import { IActionContext, ICreateChildImplContext } from 'vscode-azureextensionui';
import { showActionsMsg } from '../../constants';
import { ext } from '../../extensionVariables';
import { LocalProjectTreeItem } from '../../tree/localProject/LocalProjectTreeItem';
import { StaticWebAppTreeItem } from '../../tree/StaticWebAppTreeItem';
import { SubscriptionTreeItem } from '../../tree/SubscriptionTreeItem';
import { getGitWorkspaceState, gitPull, GitWorkspaceState, promptForDefaultBranch, VerifiedGitWorkspaceState, verifyGitWorkspaceForCreation } from '../../utils/gitUtils';
import { localize } from '../../utils/localize';
import { getWorkspaceFolder } from '../../utils/workspaceUtils';
import { showActions } from '../github/showActions';
import { openYAMLConfigFile } from '../openYAMLConfigFile';
import { GitHubOrgListStep } from './GitHubOrgListStep';
import { IStaticWebAppWizardContext } from './IStaticWebAppWizardContext';
import { postCreateStaticWebApp } from './postCreateStaticWebApp';
import { setWorkspaceContexts } from './setWorkspaceContexts';

export async function createStaticWebApp(context: IActionContext & Partial<ICreateChildImplContext> & Partial<IStaticWebAppWizardContext>, node?: SubscriptionTreeItem): Promise<StaticWebAppTreeItem> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<SubscriptionTreeItem>(SubscriptionTreeItem.contextValue, context);
    }

    let folder: WorkspaceFolder | undefined;

    await node.runWithTemporaryDescription(
        context,
        localize('startingCreate', 'Create Starting...'),
        async () => {
            folder = await getWorkspaceFolder(context);
            const gitWorkspaceState: GitWorkspaceState = await getGitWorkspaceState(context, folder.uri);
            const verifiedWorkspace: VerifiedGitWorkspaceState = await verifyGitWorkspaceForCreation(context, gitWorkspaceState, folder.uri);

            await promptForDefaultBranch(context, verifiedWorkspace.repo);
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

    const createdSs: string = localize('createdSs', 'Successfully created new static web app "{0}".  GitHub Actions is building and deploying your app, it will be available once the deployment completes.', swaNode.name);
    ext.outputChannel.appendLog(createdSs);

    const viewOutput: MessageItem = { title: localize('viewOutput', 'View Output') };
    // don't wait
    void window.showInformationMessage(createdSs, showActionsMsg, viewOutput).then(async (result) => {
        if (result === showActionsMsg) {
            await showActions(context, swaNode);
        } else if (result === viewOutput) {
            ext.outputChannel.show();
        }
    });

    folder && await gitPull(folder.uri);
    await openYAMLConfigFile(context, swaNode);

    void postCreateStaticWebApp(swaNode);

    return swaNode;
}

export async function createStaticWebAppAdvanced(context: IActionContext, node?: SubscriptionTreeItem): Promise<StaticWebAppTreeItem> {
    return await createStaticWebApp({ ...context, advancedCreation: true }, node);
}

export async function createStaticWebAppFromLocalProject(context: IActionContext, localProjectTreeItem: LocalProjectTreeItem): Promise<StaticWebAppTreeItem> {
    const localProjectPath: string = localProjectTreeItem.projectPath;
    const swaTreeItem: StaticWebAppTreeItem = await createStaticWebApp({ ...context, fsPath: localProjectPath });
    await localProjectTreeItem.refresh(context);
    return swaTreeItem;
}
