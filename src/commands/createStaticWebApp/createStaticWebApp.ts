/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { MessageItem, window, WorkspaceFolder } from 'vscode';
import { DialogResponses, IActionContext, ICreateChildImplContext } from 'vscode-azureextensionui';
import { showActionsMsg } from '../../constants';
import { ext } from '../../extensionVariables';
import { getGitApi } from '../../getExtensionApi';
import { API, Repository } from '../../git';
import { LocalProjectTreeItem } from '../../tree/localProject/LocalProjectTreeItem';
import { StaticWebAppTreeItem } from '../../tree/StaticWebAppTreeItem';
import { SubscriptionTreeItem } from '../../tree/SubscriptionTreeItem';
import { getGitWorkspaceState, GitWorkspaceState, tryGetDefaultBranch } from '../../utils/gitUtils';
import { localize } from '../../utils/localize';
import { getWorkspaceFolder } from '../../utils/workspaceUtils';
import { showActions } from '../github/showActions';
import { IStaticWebAppWizardContext } from './IStaticWebAppWizardContext';
import { postCreateStaticWebApp } from './postCreateStaticWebApp';

export async function createStaticWebApp(context: IActionContext & Partial<ICreateChildImplContext> & Partial<IStaticWebAppWizardContext>, node?: SubscriptionTreeItem): Promise<StaticWebAppTreeItem> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<SubscriptionTreeItem>(SubscriptionTreeItem.contextValue, context);
    }

    const folder: WorkspaceFolder = await getWorkspaceFolder(context);
    const gitWorkspaceState: GitWorkspaceState = await getGitWorkspaceState(context, folder.uri);

    const commitPrompt: string = localize('commitPrompt', 'Enter a commit message.');
    if (!gitWorkspaceState.repo) {
        const gitRequired: string = localize('gitRequired', 'A GitHub repository is required to create a Static Web App. Would you like to initialize your project as a git repository and create a GitHub remote?');
        await ext.ui.showWarningMessage(gitRequired, { modal: true }, DialogResponses.yes);
        const gitApi: API = await getGitApi();
        const newRepo: Repository | null = await gitApi.init(folder.uri);
        if (!newRepo) {
            throw new Error(localize('gitInitFailed', 'Git initialization failed.  Please initialize a git repository manually and attempt to create again.'));
        }

        const commitMsg: string = await ext.ui.showInputBox({ prompt: commitPrompt, placeHolder: `${commitPrompt}..`, value: localize('initCommit', 'Initial commit') });
        await newRepo.commit(commitMsg, { all: true });
        gitWorkspaceState.repo = newRepo;

    } else if (!!gitWorkspaceState.remoteUrl && !gitWorkspaceState.hasAdminAccess) {
        const adminAccess: string = localize('adminAccess', 'Admin access to the GitHub repository is required.  Please use a repo with admin access or create a fork.');
        await ext.ui.showWarningMessage(adminAccess, { modal: true });

    } else if (gitWorkspaceState.dirty && gitWorkspaceState.repo) {
        const commitChanges: string = localize('commitChanges', 'Commit all working changes to create a Static Web App.');
        await ext.ui.showWarningMessage(commitChanges, { modal: true }, { title: localize('commit', 'Commit') });

        const commitMsg: string = await ext.ui.showInputBox({ prompt: commitPrompt, placeHolder: `${commitPrompt}..` });
        // error when there are no changes staged
        await gitWorkspaceState.repo.commit(commitMsg, { all: true });
    }

    const defaultBranch: string | undefined = await tryGetDefaultBranch(gitWorkspaceState.repo)
    if (defaultBranch && gitWorkspaceState.repo.state.HEAD?.name !== defaultBranch) {
        const checkoutButton: MessageItem = { title: localize('checkout', 'Checkout "{0}"', defaultBranch) };
        const result: MessageItem = await ext.ui.showWarningMessage(localize('deployBranch', 'It is recommended to connect your SWA to the default branch "{0}".  Would you like to continue with branch "{1}"?',
            defaultBranch, gitWorkspaceState.repo.state.HEAD?.name), { modal: true }, checkoutButton, { title: localize('continue', 'Continue') });
        if (result === checkoutButton) {
            await gitWorkspaceState.repo.checkout(defaultBranch);
        }
    }

    context.fsPath = folder.uri.fsPath;

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
