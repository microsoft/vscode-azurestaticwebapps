/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit } from '@octokit/rest';
import { GitGetTreeResponseData, OctokitResponse, ReposGetBranchResponseData, ReposGetResponseData, UsersGetAuthenticatedResponseData } from '@octokit/types';
// tslint:disable-next-line:no-require-imports
import gitUrlParse = require('git-url-parse');
import * as git from 'simple-git/promise';
import { URL } from 'url';
import { authentication, QuickPickItem } from 'vscode';
import { IAzureQuickPickItem } from 'vscode-azureextensionui';
import { IStaticWebAppWizardContext } from '../commands/createStaticWebApp/IStaticWebAppWizardContext';
import { createOctokitClient } from '../commands/github/createOctokitClient';
import { GitTreeData, OrgForAuthenticatedUserData } from '../gitHubTypings';
import { localize } from './localize';
import { nonNullProp } from './nonNull';
import { getSingleRootFsPath } from './workspaceUtils';

type gitHubLink = { prev?: string; next?: string; last?: string; first?: string };

// tslint:disable:no-any no-unsafe-any
export async function getGitHubJsonResponse<T, U>(gitHubApiCb: (params: U) => Promise<OctokitResponse<any>>, params: U & { page?: number }): Promise<T> {
    // Reference for GitHub REST routes
    // https://developer.github.com/v3/
    const res: OctokitResponse<any> = await gitHubApiCb(params);
    if (res.headers.link) {
        const linkObject: gitHubLink = parseLinkHeaderToGitHubLinkObject(res.headers.link);
        const page: string | null | undefined = linkObject.next ? new URL(linkObject.next).searchParams.get('page') : undefined;
        params.page = page ? Number(page) : undefined;
    }
    return res.data;
}
// tslint:enable:no-any no-unsafe-any

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

function parseLinkHeaderToGitHubLinkObject(linkHeader: string): gitHubLink {
    const linkUrls: string[] = linkHeader.split(', ');
    const linkMap: gitHubLink = {};

    // link header response is "<https://api.github.com/organizations/6154722/repos?page=2>; rel="prev", <https://api.github.com/organizations/6154722/repos?page=4>; rel="next""
    const relative: string = 'rel=';
    for (const url of linkUrls) {
        linkMap[url.substring(url.indexOf(relative) + relative.length + 1, url.length - 1)] = url.substring(url.indexOf('<') + 1, url.indexOf('>'));
    }
    return linkMap;
}

export interface ICachedQuickPicks<T> {
    picks: IAzureQuickPickItem<T>[];
}

// tslint:disable-next-line:no-any
export async function getGitHubQuickPicksWithLoadMore<T, U>(cache: ICachedQuickPicks<T>, gitHubApiCb: (params: U) => Promise<OctokitResponse<any>>, params: U & { page?: number }, labelName: string, timeoutSeconds: number = 10): Promise<IAzureQuickPickItem<T | undefined>[]> {
    const timeoutMs: number = timeoutSeconds * 1000;
    const startTime: number = Date.now();
    let gitHubQuickPicks: T[] = [];
    do {
        gitHubQuickPicks = gitHubQuickPicks.concat(await getGitHubJsonResponse<T, U>(gitHubApiCb, params));
        if (params.page === undefined) {
            // if there is no page, that means it has retrieved all of the branches
            break;
        }
    } while (params.page !== undefined && startTime + timeoutMs > Date.now());

    cache.picks = cache.picks.concat(createQuickPickFromJsons(gitHubQuickPicks, labelName));
    cache.picks.sort((a: QuickPickItem, b: QuickPickItem) => a.label.localeCompare(b.label));

    if (params.page !== undefined) {
        return (<IAzureQuickPickItem<T | undefined>[]>[{
            label: '$(sync) Load More',
            suppressPersistence: true,
            data: undefined
        }]).concat(cache.picks);
    } else {
        return cache.picks;
    }
}

export async function getGitHubAccessToken(): Promise<string> {
    const scopes: string[] = ['repo', 'workflow', 'admin:public_key'];
    return (await authentication.getSession('github', scopes, { createIfNone: true })).accessToken;
}

export async function tryGetRemote(): Promise<string | undefined> {
    try {
        const localProjectPath: string | undefined = getSingleRootFsPath();
        // only try to get remote if there's only a single workspace opened
        if (localProjectPath) {
            const localGit: git.SimpleGit = git(localProjectPath);
            const originUrl: string | void = await localGit.remote(['get-url', 'origin']);

            if (originUrl !== undefined) {
                const { owner, name } = getRepoFullname(originUrl);
                const client: Octokit = await createOctokitClient();
                const repoData: ReposGetResponseData = (await client.repos.get({ owner, repo: name })).data;

                // to create a workflow, the user needs admin access so if it's not true, it will fail
                if (repoData.permissions.admin) {
                    return repoData.html_url;
                }
            }
        }
    } catch (error) {
        // don't do anything for an error, this shouldn't prevent creation
    }
    return;
}

export async function tryGetLocalBranch(): Promise<string | undefined> {
    try {
        const localProjectPath: string | undefined = getSingleRootFsPath();
        if (localProjectPath) {
            // only try to get branch if there's only a single workspace opened
            const localGit: git.SimpleGit = git(localProjectPath);

            return (await localGit.branch()).current;
        }
    } catch (error) {
        // an error here should be ignored, it probably means that they don't have git installed
    }
    return;
}

export function getRepoFullname(gitUrl: string): { owner: string; name: string } {
    const parsedUrl: gitUrlParse.GitUrl = gitUrlParse(gitUrl);
    return { owner: parsedUrl.owner, name: parsedUrl.name };
}

export function isUser(orgData: UsersGetAuthenticatedResponseData | OrgForAuthenticatedUserData | undefined): boolean {
    // if there's no orgData, just assume that it's a user (but this shouldn't happen)
    return !!orgData && 'type' in orgData && orgData.type === 'User';
}

export async function getGitHubTree(repositoryUrl: string, branch: string): Promise<GitTreeData[]> {
    const octokitClient: Octokit = await createOctokitClient();
    const { owner, name } = getRepoFullname(repositoryUrl);
    const branchRes: OctokitResponse<ReposGetBranchResponseData> = await octokitClient.repos.getBranch({ owner, repo: name, branch });
    const getTreeRes: OctokitResponse<GitGetTreeResponseData> = await octokitClient.git.getTree({ owner, repo: name, tree_sha: branchRes.data.commit.sha, recursive: 'true' });

    // sort descending by the depth of subfolder
    return getTreeRes.data.tree.filter(file => file.type === 'tree').sort((f1, f2) => {
        // tslint:disable-next-line: strict-boolean-expressions
        function getFolderDepth(path: string): number { return (path.match(/\//g) || []).length; }
        return getFolderDepth(f1.path) - getFolderDepth(f2.path);
    });
}

export async function getGitTreeQuickPicks(wizardContext: IStaticWebAppWizardContext, isSkippable?: boolean): Promise<IAzureQuickPickItem<string | undefined>[]> {
    const gitTreeData: GitTreeData[] = await nonNullProp(wizardContext, 'gitTreeDataTask');

    const quickPicks: IAzureQuickPickItem<string | undefined>[] = gitTreeData.map((d) => { return { label: d.path, data: d.path }; });
    // the root directory is not listed in the gitTreeData from GitHub, so just add it to the QuickPick list
    quickPicks.unshift({ label: '/', data: '/' });
    const enterInputQuickPickItem: IAzureQuickPickItem = { label: localize('input', '$(keyboard) Manually enter location'), data: undefined };
    quickPicks.push(enterInputQuickPickItem);

    const skipForNowQuickPickItem: IAzureQuickPickItem<string> = { label: localize('skipForNow', '$(clock) Skip for now'), data: '' };
    if (isSkippable) {
        quickPicks.push(skipForNowQuickPickItem);
    }

    return quickPicks;
}
