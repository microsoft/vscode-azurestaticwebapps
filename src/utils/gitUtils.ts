/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { MessageItem, Uri } from "vscode";
import { DialogResponses, IActionContext } from "vscode-azureextensionui";
import { IStaticWebAppWizardContext } from "../commands/createStaticWebApp/IStaticWebAppWizardContext";
import { ext } from "../extensionVariables";
import { getGitApi } from "../getExtensionApi";
import { API, CommitOptions, Ref, Repository } from "../git";
import { hasAdminAccessToRepo, tryGetRemote, tryGetReposGetResponseData } from "./gitHubUtils";
import { localize } from "./localize";

export type GitWorkspaceState = { repo: Repository | null, dirty?: boolean, remoteUrl?: string; hasAdminAccess?: boolean };

export async function getGitWorkspaceState(context: IActionContext & Partial<IStaticWebAppWizardContext>, uri: Uri): Promise<GitWorkspaceState> {
    const gitWorkspaceState: GitWorkspaceState = { repo: null, dirty: false, remoteUrl: undefined, hasAdminAccess: false };
    const gitApi: API = await getGitApi();
    const repo: Repository | null = gitApi.getRepository(uri);

    if (repo) {
        const originUrl: string | undefined = await tryGetRemote(uri.fsPath);
        gitWorkspaceState.repo = repo;
        gitWorkspaceState.dirty = !!repo.state.workingTreeChanges.length;
        gitWorkspaceState.remoteUrl = originUrl;
        gitWorkspaceState.hasAdminAccess = originUrl ? hasAdminAccessToRepo(await (tryGetReposGetResponseData(context, originUrl))) : false;
    }

    return gitWorkspaceState;
}

export async function verifyRepoForCreation(context: IActionContext, gitWorkspaceState: GitWorkspaceState, uri: Uri): Promise<Repository> {
    if (!gitWorkspaceState.repo) {
        const gitRequired: string = localize('gitRequired', 'A GitHub repository is required to create a Static Web App. Would you like to initialize your project as a git repository and create a GitHub remote?');
        context.telemetry.properties.cancelStep = 'initRepo';

        await ext.ui.showWarningMessage(gitRequired, { modal: true }, DialogResponses.yes);
        const gitApi: API = await getGitApi();
        const newRepo: Repository | null = await gitApi.init(uri);
        if (!newRepo) {
            throw new Error(localize('gitInitFailed', 'Git initialization failed.  Please initialize a git repository manually and attempt to create again.'));
        }

        await promptForCommit(newRepo, localize('initCommit', 'Initial commit'));
        gitWorkspaceState.repo = newRepo;

    } else if (!!gitWorkspaceState.remoteUrl && !gitWorkspaceState.hasAdminAccess) {
        context.telemetry.properties.cancelStep = 'adminAccess';

        const adminAccess: string = localize('adminAccess', 'Admin access to the GitHub repository is required.  Please use a repo with admin access or create a fork.');
        await ext.ui.showWarningMessage(adminAccess, { modal: true });

    } else if (gitWorkspaceState.dirty && gitWorkspaceState.repo) {
        context.telemetry.properties.cancelStep = 'dirtyWorkspace';

        const commitChanges: string = localize('commitChanges', 'Commit all working changes to create a Static Web App.');
        await ext.ui.showWarningMessage(commitChanges, { modal: true }, { title: localize('commit', 'Commit') });
        await promptForCommit(gitWorkspaceState.repo);
        gitWorkspaceState.dirty = false;
    }

    return gitWorkspaceState.repo;
}

export async function promptForCommit(repo: Repository, value?: string): Promise<void> {
    const commitPrompt: string = localize('commitPrompt', 'Enter a commit message.');
    // VS Code doesn't handle nested git repos very well; it'll show changes as working, but is unable to commit
    // so commit with { empty: true } so that we don't get errors when we making "empty" commits
    const commitOptions: CommitOptions = { all: true, empty: true };

    const commitMsg: string = await ext.ui.showInputBox({ prompt: commitPrompt, placeHolder: `${commitPrompt}..`, value });
    await repo.commit(commitMsg, commitOptions);
}

export async function promptForDefaultBranch(context: IActionContext, repo: Repository): Promise<void> {
    const defaultBranch: string | undefined = await tryGetDefaultBranch(repo)
    context.telemetry.properties.defaultBranch = defaultBranch;

    if (defaultBranch && repo.state.HEAD?.name !== defaultBranch) {
        context.telemetry.properties.cancelStep = 'defaultBranch';
        context.telemetry.properties.notOnDefault = 'true';

        const checkoutButton: MessageItem = { title: localize('checkout', 'Checkout "{0}"', defaultBranch) };
        const result: MessageItem = await ext.ui.showWarningMessage(localize('deployBranch', 'It is recommended to connect your SWA to the default branch "{0}".  Would you like to continue with branch "{1}"?',
            defaultBranch, repo.state.HEAD?.name), { modal: true }, checkoutButton, { title: localize('continue', 'Continue') });
        if (result === checkoutButton) {
            await repo.checkout(defaultBranch);
            context.telemetry.properties.checkoutDefault = 'true';
        } else {
            context.telemetry.properties.checkoutDefault = 'false';
        }
    }
}

export async function tryGetDefaultBranch(repo: Repository): Promise<string | undefined> {
    // currently git still uses master as the default branch but will be updated to main so handle both cases
    // https://about.gitlab.com/blog/2021/03/10/new-git-default-branch-name/#:~:text=Every%20Git%20repository%20has%20an,Bitkeeper%2C%20a%20predecessor%20to%20Git.
    const defaultBranches: string[] = ['main', 'master'];
    try {
        defaultBranches.unshift(await repo.getConfig('init.defaultBranch'));
    } catch (err) {
        // if no local config setting is found, try global
        try {
            defaultBranches.push(await repo.getGlobalConfig('init.defaultBranch'));
        } catch (err) {
            // VS Code's git API doesn't fail gracefully if no config is found, so swallow the error
        }
    }

    const localBranches: Ref[] = await repo.getBranches({ remote: false });
    // order matters here because we want the setting, main, then master respectively so use indexing
    for (let i = 0; i < localBranches.length; i++) {
        if (localBranches.some(lBranch => lBranch.name === defaultBranches[i])) {
            // only return the branch if we can find it locally, otherwise we won't be able to checkout
            return defaultBranches[i];
        }
    }

    return undefined;
}
