/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Uri } from "vscode";
import { IActionContext } from "vscode-azureextensionui";
import { getGitApi } from "../getExtensionApi";
import { API, Repository } from "../git";
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


export async function getDefaultBranch(repo: Repository): Promise<string> {
    let defaultBranch: string = 'master';
    try {
        defaultBranch = await repo.getConfig('init.defaultBranch');
    } catch (err) {
        // if no local config setting is found, try global
        try {
            defaultBranch = await repo.getGlobalConfig('init.defaultBranch');
        } catch (err) {
            // VS Code's git API doesn't fail gracefully if no config is found, so swallow the error
        }
    }
    return defaultBranch;
}

export async function defaultBranchExists(repo: Repository, defaultBranch: string): Promise<boolean> {
    return (await repo.getBranches({ remote: false })).some(branch => branch.name === defaultBranch)
}
