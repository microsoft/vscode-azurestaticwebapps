/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra, IActionContext, UserCancelledError } from "@microsoft/vscode-azext-utils";
import * as gitUrlParse from 'git-url-parse';
import { join } from 'path';
import { MessageItem, ProgressLocation, ProgressOptions, Uri, window, workspace } from 'vscode';
import { IStaticWebAppWizardContext } from "../commands/createStaticWebApp/IStaticWebAppWizardContext";
import { cloneRepo } from '../commands/github/cloneRepo';
import { defaultGitignoreContents, gitignoreFileName } from '../constants';
import { handleGitError } from '../errors';
import { ext } from "../extensionVariables";
import { getGitApi } from "../getExtensionApi";
import { API, CommitOptions, Repository } from "../git";
import { ReposGetResponseData } from '../gitHubTypings';
import { createFork, hasAdminAccessToRepo, tryGetReposGetResponseData } from "./gitHubUtils";
import { localize } from "./localize";
import { nonNullValue } from './nonNull';
import { getSingleRootFsPath } from './workspaceUtils';

export type GitWorkspaceState = { repo: Repository | null, dirty: boolean, remoteRepo: ReposGetResponseData | undefined; hasAdminAccess: boolean };
export type VerifiedGitWorkspaceState = GitWorkspaceState & { repo: Repository };

export async function getGitWorkspaceState(context: IActionContext & Partial<IStaticWebAppWizardContext>, uri: Uri): Promise<GitWorkspaceState> {
    const gitWorkspaceState: GitWorkspaceState = { repo: null, dirty: false, remoteRepo: undefined, hasAdminAccess: false };
    const gitApi: API = await getGitApi();
    let repo: Repository | null = null;

    try {
        repo = await gitApi.openRepository(uri);
    } catch (err) {
        handleGitError(err);
    }

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
    if ((await workspace.fs.readDirectory(uri)).filter(file => file[0] !== gitFolderName).length === 0) {
        // if the git repo is empty, git push will fail and create an empty GitHub repo so throw an error here
        throw new Error(localize('emptyWorkspace', 'Cannot create a Static Web App with an empty workspace.'));
    }

    let repo: Repository | null = gitWorkspaceState.repo;

    if (!gitWorkspaceState.repo) {
        const gitRequired: string = localize('gitRequired', 'A GitHub repository is required to proceed. Create a local git repository and GitHub remote to create a Static Web App.');

        await context.ui.showWarningMessage(gitRequired, { modal: true, stepName: 'initRepo' }, { title: localize('create', 'Create') });
        const gitApi: API = await getGitApi();
        try {
            repo = await gitApi.init(uri)
        } catch (err) {
            handleGitError(err);
        }

        if (!repo) {
            throw new Error(localize('gitInitFailed', 'Local git initialization failed.  Create a git repository manually and try to create again.'));
        }

        // create a generic .gitignore for user if we do not detect one
        const gitignorePath: string = join(uri.fsPath, gitignoreFileName);
        if (!await AzExtFsExtra.pathExists(gitignorePath)) {
            await AzExtFsExtra.writeFile(gitignorePath, defaultGitignoreContents);
        }
        await promptForCommit(context, repo, localize('initCommit', 'Initial commit'), 'initCommit');
    } else if (!!gitWorkspaceState.remoteRepo && !gitWorkspaceState.hasAdminAccess) {

        const adminAccess: string = localize('adminAccess', 'Admin access to the GitHub repository "{0}" is required. Would you like to create a fork?', gitWorkspaceState.remoteRepo.name);
        const createForkItem: MessageItem = { title: localize('createFork', 'Create Fork') };
        await context.ui.showWarningMessage(adminAccess, { modal: true, stepName: 'adminAccess' }, createForkItem);

        const repoUrl: string = (await createFork(context, gitWorkspaceState.remoteRepo)).data.html_url;

        let cancelStep: string = 'cloneFork';
        let forkSuccess: string = localize('forkSuccess', 'Successfully forked "{0}".', gitWorkspaceState.remoteRepo.name);
        ext.outputChannel.appendLog(forkSuccess);
        forkSuccess += localize('cloneNewRepo', ' Would you like to clone your new repository?');

        const clone: MessageItem = { title: localize('clone', 'Clone Repo') };
        const result: MessageItem | undefined = await window.showInformationMessage(forkSuccess, clone)
        if (result === clone) {
            void cloneRepo(context, repoUrl);
            cancelStep = 'afterCloneFork';
        }

        throw new UserCancelledError(cancelStep);
    } else if (gitWorkspaceState.dirty && gitWorkspaceState.repo) {
        const commitChanges: string = localize('commitChanges', 'Commit all working changes to create a Static Web App.');
        await context.ui.showWarningMessage(commitChanges, { modal: true, stepName: 'dirtyWorkspace' }, { title: localize('commit', 'Commit') });
        await promptForCommit(context, gitWorkspaceState.repo, localize('commitMade', 'Commit made from VS Code Azure Static Web Apps'), 'dirtyCommit');
    }

    const verifiedRepo: Repository = nonNullValue(repo);
    return { ...gitWorkspaceState, dirty: false, repo: verifiedRepo }
}

export async function tryGetRemote(localProjectPath?: string): Promise<string | undefined> {
    let originUrl: string | void | undefined;
    localProjectPath = localProjectPath || getSingleRootFsPath();
    // only try to get remote if provided a path or if there's only a single workspace opened
    if (localProjectPath) {
        try {
            const gitApi: API = await getGitApi();
            const repo = await gitApi.openRepository(Uri.file(localProjectPath));
            return repo?.state.remotes.find(remote => remote.name === 'origin')?.fetchUrl;
        } catch (err) {
            // do nothing, remote origin does not exist
        }
    }

    return originUrl ? originUrl : undefined;
}

export function getRepoFullname(gitUrl: string): { owner: string; name: string } {
    const parsedUrl: gitUrlParse.GitUrl = gitUrlParse(gitUrl);
    return { owner: parsedUrl.owner, name: parsedUrl.name };
}


export async function remoteShortnameExists(fsPath: string, remoteName: string): Promise<boolean> {
    const gitApi: API = await getGitApi();
    const repo = await gitApi.openRepository(Uri.file(fsPath));
    let remoteExists: boolean = false;

    try {
        remoteExists = !!repo?.state.remotes.some(r => { return r.name === remoteName; });
    } catch (error) {
        // ignore the error and assume there is no origin
    }

    return remoteExists;
}


async function promptForCommit(context: IActionContext, repo: Repository, value?: string, stepName?: string): Promise<void> {
    const commitPrompt: string = localize('commitPrompt', 'Enter a commit message.');
    const commitOptions: CommitOptions = { all: true };

    const commitMsg: string = await context.ui.showInputBox({ prompt: commitPrompt, placeHolder: `${commitPrompt}..`, value, stepName });
    try {
        await repo.commit(commitMsg, commitOptions)
    } catch (err) {
        handleGitError(err);
    }
}

export async function tryGetLocalBranch(): Promise<string | undefined> {
    try {
        const localProjectPath: string | undefined = getSingleRootFsPath();
        if (localProjectPath) {
            // only try to get branch if there's only a single workspace opened
            const gitApi: API = await getGitApi();
            const repo = await gitApi.openRepository(Uri.file(localProjectPath));
            return repo?.state.HEAD?.name;
        }
    } catch (error) {
        handleGitError(error);
    }
    return;
}

export async function warnIfNotOnDefaultBranch(context: IActionContext, gitState: VerifiedGitWorkspaceState): Promise<void> {
    const defaultBranch: string | undefined = await tryGetDefaultBranch(context, gitState)
    context.telemetry.properties.defaultBranch = defaultBranch;
    context.telemetry.properties.notOnDefault = 'false';
    const { repo } = gitState;

    if (defaultBranch && repo.state.HEAD?.name !== defaultBranch) {
        context.telemetry.properties.notOnDefault = 'true';

        const checkoutButton: MessageItem = { title: localize('checkout', 'Checkout "{0}"', defaultBranch) };
        const result: MessageItem = await context.ui.showWarningMessage(localize('deployBranch', 'It is recommended to connect your SWA to the default branch "{0}".  Would you like to continue with branch "{1}"?',
            defaultBranch, repo.state.HEAD?.name), { modal: true, stepName: 'defaultBranch' }, checkoutButton, { title: localize('continue', 'Continue') });
        if (result === checkoutButton) {
            try {
                await repo.checkout(defaultBranch);
            } catch (err) {
                handleGitError(err);
            }
            context.telemetry.properties.checkoutDefault = 'true';
        } else {
            context.telemetry.properties.checkoutDefault = 'false';
        }
    }
}

export async function gitPull(repo: Repository): Promise<void> {
    const options: ProgressOptions = {
        location: ProgressLocation.Notification,
        title: localize('executingGitPull', 'Executing "git pull"...')
    };
    await window.withProgress(options, async () => {
        try {
            await repo.pull();
        } catch (error) {
            handleGitError(error)
        }
    });
}

async function tryGetDefaultBranch(context: IActionContext, gitState: VerifiedGitWorkspaceState): Promise<string | undefined> {
    let defaultBranches: string[];

    if (gitState.remoteRepo) {
        defaultBranches = [gitState.remoteRepo.default_branch]
        context.telemetry.properties.defaultBranchSource = 'remoteConfig';
    } else {
        context.telemetry.properties.defaultBranchSource = 'defaultConfig';
        defaultBranches = ['main', 'master'];
        // currently git still uses master as the default branch but will be updated to main so handle both cases
        // https://about.gitlab.com/blog/2021/03/10/new-git-default-branch-name/#:~:text=Every%20Git%20repository%20has%20an,Bitkeeper%2C%20a%20predecessor%20to%20Git.
        try {
            // don't use handleGitError because we're handling the errors differently here
            defaultBranches.unshift(await gitState.repo.getConfig('init.defaultBranch'));
            context.telemetry.properties.defaultBranchSource = 'localConfig';
        } catch (err) {
            // if no local config setting is found, try global
            try {
                defaultBranches.unshift(await gitState.repo.getGlobalConfig('init.defaultBranch'));
                context.telemetry.properties.defaultBranchSource = 'globalConfig';
            } catch (err) {
                // VS Code's git API doesn't fail gracefully if no config is found, so swallow the error
            }
        }
    }

    context.telemetry.properties.foundLocalBranch = 'false';

    // order matters here because we want the remote/setting, main, then master respectively so use indexing
    for (let i = 0; i < defaultBranches.length; i++) {
        if (gitState.repo.state.refs.some(lBranch => lBranch.name === defaultBranches[i])) {
            context.telemetry.properties.foundLocalBranch = 'true';
            // only return the branch if we can find it locally, otherwise we won't be able to checkout
            return defaultBranches[i];
        }
    }

    return undefined;
}
