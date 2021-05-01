/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit } from '@octokit/rest';
import { authentication } from 'vscode';
import { IActionContext, IAzureQuickPickItem, parseError, UserCancelledError } from 'vscode-azureextensionui';
import { createOctokitClient } from '../commands/github/createOctokitClient';
import { ListOrgsForUserData, OrgForAuthenticatedUserData, ReposGetResponseData } from '../gitHubTypings';
import { getRepoFullname, tryGetRemote } from './gitUtils';

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

export async function getGitHubAccessToken(context: IActionContext): Promise<string> {
    const scopes: string[] = ['repo', 'workflow', 'admin:public_key'];
    try {
        return (await authentication.getSession('github', scopes, { createIfNone: true })).accessToken;
    } catch (error) {
        if (parseError(error).message === 'User did not consent to login.') {
            context.telemetry.properties.cancelStep = 'getGitHubToken';
            throw new UserCancelledError();
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
