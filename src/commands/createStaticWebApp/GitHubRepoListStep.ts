/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit, RestEndpointMethodTypes } from '@octokit/rest';
import { AzureWizardPromptStep, IAzureQuickPickItem } from 'vscode-azureextensionui';
import { ext } from '../../extensionVariables';
import { BranchData, ListOrgsForUserData, OrgForAuthenticatedUserData, RepoData, RepoParameters, ReposGetResponseData } from '../../gitHubTypings';
import { getGitHubQuickPicksWithLoadMore, getRepoFullname, ICachedQuickPicks, isUser } from '../../utils/gitHubUtils';
import { localize } from '../../utils/localize';
import { nonNullProp } from '../../utils/nonNull';
import { createOctokitClient } from '../github/createOctokitClient';
import { CreateNewResource, IStaticWebAppWizardContext } from './IStaticWebAppWizardContext';

const createNewRepo: string = 'createNewRepo';



type RepoResponse = RestEndpointMethodTypes['repos']['listForOrg']['response'] | RestEndpointMethodTypes['repos']['listForUser']['response'];

export class GitHubRepoListStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {

    public async prompt(context: IStaticWebAppWizardContext): Promise<void> {
        const placeHolder: string = localize('chooseRepo', 'Choose repository');
        let repoData: RepoData | CreateNewResource | undefined;
        const orgData: ListOrgsForUserData | OrgForAuthenticatedUserData = nonNullProp(context, 'orgData');
        const picksCache: ICachedQuickPicks<RepoData> = { picks: [] };
        const params: RepoParameters = isUser(orgData) ? { username: orgData.login, type: 'owner' } : { org: orgData.login, type: 'member' };

        do {
            repoData = (await ext.ui.showQuickPick(this.getRepoPicks(context, params, orgData, picksCache), { placeHolder })).data;
        } while (!repoData);

        context.repoData = repoData;
        if (context.repoData.name) {
            context.valuesToMask.push(context.repoData.name);
        }

        context.repoHtmlUrl = repoData.html_url;
        // if this is a new repo, the only branch that will have been created is 'main', if it's basic create, use the default branch
        context.branchData = repoData.name === createNewRepo ?
            { name: 'main' } : !context.advancedCreation ?
                await this.getDefaultBranchForRepo(context) : undefined;

    }

    public shouldPrompt(context: IStaticWebAppWizardContext): boolean {
        return !context.repoHtmlUrl;
    }

    private async getRepoPicks(context: IStaticWebAppWizardContext, params: RepoParameters, orgData: ListOrgsForUserData | OrgForAuthenticatedUserData, picksCache: ICachedQuickPicks<RepoData>): Promise<IAzureQuickPickItem<RepoData | CreateNewResource | undefined>[]> {
        const client: Octokit = await createOctokitClient(context);
        const callback: (params?: RepoParameters) => Promise<RepoResponse> = isUser(orgData) ? client.repos.listForUser : client.repos.listForOrg;
        return await getGitHubQuickPicksWithLoadMore<RepoData, RepoParameters>(picksCache, callback, params, 'name');

    }

    private async getDefaultBranchForRepo(context: IStaticWebAppWizardContext): Promise<BranchData> {
        const client: Octokit = await createOctokitClient(context);
        const { owner, name } = getRepoFullname(nonNullProp(context, 'repoHtmlUrl'));
        const remoteRepo: ReposGetResponseData = (await client.repos.get({ owner, repo: name })).data;
        return <BranchData><unknown>(await client.repos.getBranch({ owner, repo: name, branch: remoteRepo.default_branch })).data;
    }
}
