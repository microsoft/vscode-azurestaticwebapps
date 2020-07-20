/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// tslint:disable-next-line:no-require-imports
import gitUrlParse = require('git-url-parse');
import { HttpMethods, IncomingMessage, TokenCredentials } from 'ms-rest';
import { Response } from 'request';
import * as git from 'simple-git/promise';
import { isArray } from 'util';
import * as vscode from 'vscode';
import { IAzureQuickPickItem } from 'vscode-azureextensionui';
import { Conclusion, githubApiEndpoint, Status } from '../constants';
import { localize } from './localize';
import { requestUtils } from './requestUtils';

// tslint:disable-next-line:no-reserved-keywords
export type gitHubOrgData = { login: string; repos_url: string; type: 'User' | 'Organization' };
export type gitHubRepoData = { name: string; url: string; html_url: string; clone_url?: string; default_branch?: string };
export type gitHubBranchData = { name: string };
export type gitHubLink = { prev?: string; next?: string; last?: string; first?: string };
export type gitHubWebResource = requestUtils.Request & { nextLink?: string };

export async function getGitHubJsonResponse<T>(requestOptions: gitHubWebResource): Promise<T> {
    // Reference for GitHub REST routes
    // https://developer.github.com/v3/
    // Note: blank after user implies look up authorized user
    const gitHubResponse: Response = await requestUtils.sendRequest(requestOptions);
    if (gitHubResponse.headers.link) {
        const headerLink: string = <string>gitHubResponse.headers.link;
        const linkObject: gitHubLink = parseLinkHeaderToGitHubLinkObject(headerLink);
        requestOptions.nextLink = linkObject.next;
    }
    // tslint:disable-next-line:no-unsafe-any
    return <T>JSON.parse(gitHubResponse.body);
}

/**
 * @param label Property of JSON that will be used as the QuickPicks label
 * @param description Optional property of JSOsN that will be used as QuickPicks description
 * @param data Optional property of JSON that will be used as QuickPicks data saved as a NameValue pair
 */
export function createQuickPickFromJsons<T>(jsons: T[], label: string): IAzureQuickPickItem<T>[] {
    const quickPicks: IAzureQuickPickItem<T>[] = [];
    if (!isArray(jsons)) {
        jsons = [jsons];
    }

    for (const json of jsons) {
        if (!json[label]) {
            // skip this JSON if it doesn't have this label
            continue;
        }

        quickPicks.push({
            label: <string>json[label],
            data: json
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

export async function getGitHubQuickPicksWithLoadMore<T>(cache: ICachedQuickPicks<T>, requestOptions: gitHubWebResource, labelName: string, timeoutSeconds: number = 10): Promise<IAzureQuickPickItem<T | undefined>[]> {
    const timeoutMs: number = timeoutSeconds * 1000;
    const startTime: number = Date.now();
    let gitHubQuickPicks: T[] = [];
    do {
        gitHubQuickPicks = gitHubQuickPicks.concat(await getGitHubJsonResponse<T[]>(requestOptions));
        if (requestOptions.nextLink) {
            // if there is another link, set the next request url to point at that
            requestOptions.url = requestOptions.nextLink;
        }
    } while (requestOptions.nextLink && startTime + timeoutMs > Date.now());

    cache.picks = cache.picks.concat(createQuickPickFromJsons(gitHubQuickPicks, labelName));
    cache.picks.sort((a: vscode.QuickPickItem, b: vscode.QuickPickItem) => a.label.localeCompare(b.label));

    if (requestOptions.nextLink) {
        return (<IAzureQuickPickItem<T | undefined>[]>[{
            label: '$(sync) Load More',
            suppressPersistence: true,
            data: undefined
        }]).concat(cache.picks);
    } else {
        return cache.picks;
    }
}

export async function createGitHubRequestOptions(gitHubAccessToken: string, url: string, method: HttpMethods = 'GET'): Promise<gitHubWebResource> {
    const requestOptions: gitHubWebResource = await requestUtils.getDefaultRequest(url, new TokenCredentials(gitHubAccessToken), method);
    requestOptions.headers.Accept = 'application/vnd.github.v3+json';
    requestOptions.resolveWithFullResponse = true;

    return requestOptions;
}

export async function getGitHubAccessToken(): Promise<string> {
    const scopes: string[] = ['repo', 'workflow', 'admin:public_key'];
    return (await vscode.authentication.getSession('github', scopes, { createIfNone: true })).accessToken;

}

export async function tryGetRemote(): Promise<string | undefined> {
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length === 1) {
        // only try to get remote if there's only a single workspace opened
        const localGit: git.SimpleGit = git(vscode.workspace.workspaceFolders[0].uri.fsPath);

        try {
            const originUrl: string | void = await localGit.remote(['get-url', 'origin']);

            if (originUrl !== undefined) {
                const { owner, name } = getRepoFullname(originUrl);
                const token: string = await getGitHubAccessToken();
                const repoReq: requestUtils.Request = await createGitHubRequestOptions(token, `${githubApiEndpoint}/repos/${owner}/${name}`);
                const repoRes: IncomingMessage & { body: string } = await requestUtils.sendRequest(repoReq);

                // the GitHub API response has a lot more properties than this, but these are the only ones we care about
                const bodyJson: { html_url: string; permissions: { admin: boolean } } = <{ html_url: string; permissions: { admin: boolean } }>JSON.parse(repoRes.body);

                // to create a workflow, the user needs admin access so if it's not true, it will fail
                if (bodyJson.permissions.admin) {
                    return bodyJson.html_url;
                }
            }

        } catch (error) {
            // don't do anything for an error, this shouldn't prevent creation
        }
    }

    return;
}

export function getRepoFullname(gitUrl: string): { owner: string; name: string } {
    const parsedUrl: gitUrlParse.GitUrl = gitUrlParse(gitUrl);
    return { owner: parsedUrl.owner, name: parsedUrl.name };
}

export function isUser(orgData: gitHubOrgData | undefined): boolean {
    // if there's no orgData, just assume that it's a user (but this shouldn't happen)
    return orgData ? orgData.type === 'User' : true;
}

export function convertConclusionToVerb(conclusion: Conclusion): string {
    switch (conclusion) {
        case 'success':
            return localize('succeeded', 'succeeded');
        case 'cancelled':
            return localize('cancelled', 'cancelled');
        case 'failure':
            return localize('failed', 'failed');
        case 'skipped':
            return localize('skipped', 'skipped');
        default:
            return '';
    }
}

export function convertStatusToVerb(status: Status): string {
    switch (status) {
        case 'in_progress':
            return localize('started', 'started');
        case 'queued':
            return localize('queued', 'queued');
        default:
            return '';
    }
}
