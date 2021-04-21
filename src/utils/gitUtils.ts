/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fse from 'fs-extra';
import * as git from 'simple-git/promise';
import { MessageItem, Uri } from "vscode";
import { DialogResponses, IActionContext } from "vscode-azureextensionui";
import { IStaticWebAppWizardContext } from "../commands/createStaticWebApp/IStaticWebAppWizardContext";
import { ext } from "../extensionVariables";
import { getGitApi } from "../getExtensionApi";
import { API, CommitOptions, Ref, Repository } from "../git";
import { ReposGetResponseData } from '../gitHubTypings';
import { hasAdminAccessToRepo, tryGetRemote, tryGetReposGetResponseData } from "./gitHubUtils";
import { localize } from "./localize";

export type GitWorkspaceState = { repo: Repository | null, dirty: boolean, remoteRepo: ReposGetResponseData | undefined; hasAdminAccess: boolean };
export type VerifiedGitWorkspaceState = GitWorkspaceState & { repo: Repository };

export async function getGitWorkspaceState(context: IActionContext & Partial<IStaticWebAppWizardContext>, uri: Uri): Promise<GitWorkspaceState> {
    const gitWorkspaceState: GitWorkspaceState = { repo: null, dirty: false, remoteRepo: undefined, hasAdminAccess: false };
    const gitApi: API = await getGitApi();
    const repo: Repository | null = await gitApi.openRepository(uri);

    if (repo) {
        const originUrl: string | undefined = await tryGetRemote(uri.fsPath);
        gitWorkspaceState.repo = repo;
        gitWorkspaceState.dirty = !!(repo.state.workingTreeChanges.length || repo.state.indexChanges.length);

        if (originUrl) {
            gitWorkspaceState.remoteRepo = await tryGetReposGetResponseData(context, originUrl);
            gitWorkspaceState.hasAdminAccess = hasAdminAccessToRepo(gitWorkspaceState.remoteRepo);
        }
    }

    return gitWorkspaceState;
}

/* Function used to enforce all our opinionated requirements for creating a Static Web App */
export async function verifyGitWorkspaceForCreation(context: IActionContext, gitWorkspaceState: GitWorkspaceState, uri: Uri): Promise<VerifiedGitWorkspaceState> {
    const gitFolderName: string = '.git';
    if ((await fse.readdir(uri.fsPath)).filter(file => file !== gitFolderName).length === 0) {
        // if the git repo is empty, git push will fail and create an empty GitHub repo so throw an error here
        throw new Error(localize('emptyWorkspace', 'Cannot create a Static Web App with an empty workspace.'));
    }

    if (!gitWorkspaceState.repo) {
        const gitRequired: string = localize('gitRequired', 'A GitHub repository is required to create a Static Web App. Would you like to initialize your project as a git repository and create a GitHub remote?');
        context.telemetry.properties.cancelStep = 'initRepo';

        await ext.ui.showWarningMessage(gitRequired, { modal: true }, DialogResponses.yes);
        const gitApi: API = await getGitApi();
        let newRepo: Repository | null = await gitApi.init(uri);
        if (!newRepo) {
            const localGit: git.SimpleGit = git(uri.fsPath);
            await localGit.init({});
            newRepo = await gitApi.openRepository(uri);
            if (!newRepo) {
                throw new Error(localize('gitInitFailed', 'Git initialization failed.  Please initialize a git repository manually and attempt to create again.'));
            }

        }

        await promptForCommit(newRepo, localize('initCommit', 'Initial commit'));
        gitWorkspaceState.repo = newRepo;

    } else if (!!gitWorkspaceState.remoteRepo && !gitWorkspaceState.hasAdminAccess) {
        context.telemetry.properties.cancelStep = 'adminAccess';

        const adminAccess: string = localize('adminAccess', 'Admin access to the GitHub repository is required.  Please use a repo with admin access or create a fork.');
        await ext.ui.showWarningMessage(adminAccess, { modal: true });

    } else if (gitWorkspaceState.dirty && gitWorkspaceState.repo) {
        context.telemetry.properties.cancelStep = 'dirtyWorkspace';

        const commitChanges: string = localize('commitChanges', 'Commit all working changes to create a Static Web App.');
        await ext.ui.showWarningMessage(commitChanges, { modal: true }, { title: localize('commit', 'Commit') });
        await promptForCommit(gitWorkspaceState.repo, localize('commitMade', 'Commit made from VS Code Azure Static Web Apps'));
        gitWorkspaceState.dirty = false;
    }

    return <VerifiedGitWorkspaceState>gitWorkspaceState;
}

async function promptForCommit(repo: Repository, value?: string): Promise<void> {
    const commitPrompt: string = localize('commitPrompt', 'Enter a commit message.');
    const commitOptions: CommitOptions = { all: true };

    const commitMsg: string = await ext.ui.showInputBox({ prompt: commitPrompt, placeHolder: `${commitPrompt}..`, value });
    try {
        await repo.commit(commitMsg, commitOptions);
    } catch (err) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (!/nothing to commit/.test(err.stdout)) {
            // ignore empty commit errors which will happen if a user initializes a blank folder or have changes in a nested git repo
            throw (err);
        }
    }
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

async function tryGetDefaultBranch(repo: Repository): Promise<string | undefined> {
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
    for (let i = 0; i < defaultBranches.length; i++) {
        if (localBranches.some(lBranch => lBranch.name === defaultBranches[i])) {
            // only return the branch if we can find it locally, otherwise we won't be able to checkout
            return defaultBranches[i];
        }
    }

    return undefined;
}
