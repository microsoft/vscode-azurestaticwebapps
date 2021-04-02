/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Uri } from "vscode";
import { IActionContext } from "vscode-azureextensionui";
import { getGitApi } from "../getExtensionApi";
import { API, Ref, Repository } from "../git";
import { hasAdminAccessToRepo, tryGetRemote, tryGetReposGetResponseData } from "./gitHubUtils";

export type GitWorkspaceState = { repo: Repository | null, dirty?: boolean, remoteUrl?: string; hasAdminAccess?: boolean };
export async function getGitWorkspaceState(context: IActionContext, uri: Uri): Promise<GitWorkspaceState> {
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
