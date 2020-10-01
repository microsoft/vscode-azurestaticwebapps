/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit, RestEndpointMethodTypes } from '@octokit/rest';
import { UsersGetAuthenticatedResponseData } from '@octokit/types';
import { AzureWizardPromptStep, IAzureQuickPickItem, IWizardOptions } from 'vscode-azureextensionui';
import { ext } from '../../extensionVariables';
import { OrgForAuthenticatedUserData, RepoData } from '../../gitHubTypings';
import { getGitHubQuickPicksWithLoadMore, ICachedQuickPicks, isUser } from '../../utils/gitHubUtils';
import { localize } from '../../utils/localize';
import { nonNullProp } from '../../utils/nonNull';
import { createOctokitClient } from '../github/createOctokitClient';
import { CreateNewResource, IStaticWebAppWizardContext } from './IStaticWebAppWizardContext';
import { RepoCreateStep } from './RepoCreateStep';
import { RepoNameStep } from './RepoNameStep';

const createNewRepo: string = 'createNewRepo';
type RepoParameters = RestEndpointMethodTypes['repos']['listForUser']['parameters'] | RestEndpointMethodTypes['repos']['listForOrg']['parameters'];
type RepoResponse = RestEndpointMethodTypes['repos']['listForOrg']['response'] | RestEndpointMethodTypes['repos']['listForUser']['response'];

export class GitHubRepoListStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {

    public async prompt(context: IStaticWebAppWizardContext): Promise<void> {
        const placeHolder: string = localize('chooseRepo', 'Choose repository');
        let repoData: RepoData | CreateNewResource | undefined;
        const orgData: UsersGetAuthenticatedResponseData | OrgForAuthenticatedUserData = nonNullProp(context, 'orgData');
        const picksCache: ICachedQuickPicks<RepoData> = { picks: [] };
        const params: RepoParameters = isUser(orgData) ? { username: orgData.login, type: 'owner' } : { org: orgData.login, type: 'member' };

        do {
            repoData = (await ext.ui.showQuickPick(this.getRepoPicks(context, params, orgData, picksCache), { placeHolder })).data;
        } while (!repoData);

        context.repoData = repoData;
        context.repoHtmlUrl = repoData.html_url;
        // if this is a new repo, the only branch that will have been created is 'main'
        context.branchData = repoData.name === createNewRepo ? { name: 'main' } : undefined;
    }

    public shouldPrompt(context: IStaticWebAppWizardContext): boolean {
        return !context.repoHtmlUrl;
    }

    public async getSubWizard(context: IStaticWebAppWizardContext): Promise<IWizardOptions<IStaticWebAppWizardContext> | undefined> {
        if (context.repoData?.name === createNewRepo) {
            return { promptSteps: [new RepoNameStep()], executeSteps: [new RepoCreateStep()] };
        } else {
            return undefined;
        }
    }

    private async getRepoPicks(context: IStaticWebAppWizardContext, params: RepoParameters, orgData: UsersGetAuthenticatedResponseData | OrgForAuthenticatedUserData, picksCache: ICachedQuickPicks<RepoData>): Promise<IAzureQuickPickItem<RepoData | CreateNewResource | undefined>[]> {
        const client: Octokit = await createOctokitClient(context.accessToken);
        const callback: (params?: RepoParameters) => Promise<RepoResponse> = isUser(orgData) ? client.repos.listForUser : client.repos.listForOrg;
        const quickPickItems: IAzureQuickPickItem<RepoData | CreateNewResource | undefined>[] =
            await getGitHubQuickPicksWithLoadMore<RepoData, RepoParameters>(picksCache, callback, params, 'name');
        quickPickItems.unshift({ label: localize(createNewRepo, '$(plus) Create a new GitHub repository...'), data: { name: createNewRepo, html_url: createNewRepo } });

        return quickPickItems;
    }
}
