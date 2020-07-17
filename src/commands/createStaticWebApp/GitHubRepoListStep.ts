/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IAzureQuickPickItem, IWizardOptions } from 'vscode-azureextensionui';
import { githubApiEndpoint } from '../../constants';
import { ext } from '../../extensionVariables';
import { createGitHubRequestOptions, getGitHubQuickPicksWithLoadMore, gitHubOrgData, gitHubRepoData, gitHubWebResource, ICachedQuickPicks, isUser } from '../../utils/gitHubUtils';
import { localize } from '../../utils/localize';
import { nonNullProp } from '../../utils/nonNull';
import { IStaticWebAppWizardContext } from './IStaticWebAppWizardContext';
import { RepoCreateStep } from './RepoCreateStep';
import { RepoNameStep } from './RepoNameStep';

const createNewRepo: string = 'createNewRepo';
export class GitHubRepoListStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {

    public async prompt(context: IStaticWebAppWizardContext): Promise<void> {
        const placeHolder: string = localize('chooseRepo', 'Choose repository');
        let repoData: gitHubRepoData | undefined;
        const orgData: gitHubOrgData = nonNullProp(context, 'orgData');
        const requestOptions: gitHubWebResource = await createGitHubRequestOptions(context.accessToken, isUser(orgData) ? `${githubApiEndpoint}/user/repos?type=owner` : orgData.repos_url);
        const picksCache: ICachedQuickPicks<gitHubRepoData> = { picks: [] };

        do {
            repoData = (await ext.ui.showQuickPick(this.getRepoPicks(requestOptions, picksCache), { placeHolder })).data;
        } while (!repoData);

        context.repoData = repoData;
        context.repoHtmlUrl = repoData.html_url;
        // if this is a new repo, the only branch that will have been created is 'master'
        context.branchData = repoData.name === createNewRepo ? { name: 'master' } : undefined;
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

    private async getRepoPicks(requestOptions: gitHubWebResource, picksCache: ICachedQuickPicks<gitHubRepoData>): Promise<IAzureQuickPickItem<gitHubRepoData | undefined>[]> {
        const quickPickItems: IAzureQuickPickItem<gitHubRepoData | undefined>[] =
            await getGitHubQuickPicksWithLoadMore<gitHubRepoData>(picksCache, requestOptions, 'name');
        quickPickItems.unshift({ label: localize(createNewRepo, '$(plus) Create a new GitHub repository...'), data: { name: createNewRepo, html_url: createNewRepo, url: createNewRepo } });

        return quickPickItems;
    }
}
