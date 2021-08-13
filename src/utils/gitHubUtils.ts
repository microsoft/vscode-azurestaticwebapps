/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit } from '@octokit/rest';
import { authentication, ProgressLocation, window } from 'vscode';
import { IActionContext, IAzureQuickPickItem, parseError, UserCancelledError } from 'vscode-azureextensionui';
import { createOctokitClient } from '../commands/github/createOctokitClient';
import { githubAuthProviderId, githubScopes } from '../constants';
import { ext } from '../extensionVariables';
import { ListOrgsForUserData, OrgForAuthenticatedUserData, ReposCreateForkResponse, ReposGetResponseData } from '../gitHubTypings';
import { getRepoFullname, tryGetRemote } from './gitUtils';
import { localize } from './localize';
import { nonNullProp } from './nonNull';

/**
 * @param label Property of JSON that will be used as the QuickPicks label
 * @param description Optional property of JSON that will be used as QuickPicks description
 * @param data Optional property of JSON that will be used as QuickPicks data saved as a NameValue pair
 */
export function createQuickPickFromJsons<T>(data: T[], label: string): IAzureQuickPickItem<T>[] {
    const quickPicks: IAzureQuickPickItem<T>[] = [];

    for (const d of data) {
        if (!d[label]) {
            // skip this JSON if it doesn't have this label
            continue;
        }

        quickPicks.push({
            label: <string>d[label],
            data: d
        });
    }

    return quickPicks;
}

export async function getGitHubAccessToken(): Promise<string> {
    try {
        return (await authentication.getSession(githubAuthProviderId, githubScopes, { createIfNone: true })).accessToken;
    } catch (error) {
        if (parseError(error).message === 'User did not consent to login.') {
            throw new UserCancelledError('getGitHubToken');
        }

        throw error;
    }
}

export async function tryGetReposGetResponseData(context: IActionContext, originUrl: string): Promise<ReposGetResponseData | undefined> {
    const { owner, name } = getRepoFullname(originUrl);
    const client: Octokit = await createOctokitClient(context);
    try {
        return (await client.repos.get({ owner, repo: name })).data;
    } catch (error) {
        // don't do anything for an error, it means the repo doesn't exist on GitHub
    }

    return undefined;
}

export function hasAdminAccessToRepo(repoData?: ReposGetResponseData): boolean {
    // to create a workflow, the user needs admin access so if it's not true, it will fail
    return !!repoData?.permissions?.admin
}

export async function tryGetRepoDataForCreation(context: IActionContext, localProjectPath?: string): Promise<ReposGetResponseData | undefined> {
    const originUrl: string | undefined = await tryGetRemote(localProjectPath);
    if (originUrl) {
        const repoData: ReposGetResponseData | undefined = await tryGetReposGetResponseData(context, originUrl);
        if (hasAdminAccessToRepo(repoData)) {
            return repoData;
        }
    }

    return undefined;
}

export function isUser(orgData: ListOrgsForUserData | OrgForAuthenticatedUserData | undefined): boolean {
    // if there's no orgData, just assume that it's a user (but this shouldn't happen)
    return !!orgData && 'type' in orgData && orgData.type === 'User';
}

export async function createFork(context: IActionContext, remoteRepo: ReposGetResponseData): Promise<ReposCreateForkResponse> {
    let createForkResponse: ReposCreateForkResponse | undefined;

    if (remoteRepo.owner?.login) {
        const client: Octokit = await createOctokitClient(context);
        const forking: string = localize('forking', 'Forking "{0}"...', remoteRepo.name);
        ext.outputChannel.appendLog(forking);

        await window.withProgress({ location: ProgressLocation.Notification, title: forking }, async () => {
            createForkResponse = await client.repos.createFork({
                owner: nonNullProp(remoteRepo, 'owner').login,
                repo: remoteRepo.name
            });
        });
    }

    if (createForkResponse?.status === 202) {
        return createForkResponse;
    } else {
        throw new Error(localize('forkFail', 'Could not automatically fork repository. Please fork [{0}]({1}) manually.', remoteRepo.name, remoteRepo.html_url));
    }
}



