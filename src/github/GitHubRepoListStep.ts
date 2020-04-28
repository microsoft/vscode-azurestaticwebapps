/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IAzureQuickPickItem, IWizardOptions } from 'vscode-azureextensionui';
import { RepoCreateStep } from '../commands/createNewEndpoint/RepoCreateStep';
import { RepoNameStep } from '../commands/createNewEndpoint/RepoNameStep';
import { IStaticWebAppWizardContext } from '../commands/createStaticWebApp/IStaticWebAppWizardContext';
import { ext } from '../extensionVariables';
import { createGitHubRequestOptions, getGitHubQuickPicksWithLoadMore, gitHubRepoData, gitHubWebResource, ICachedQuickPicks } from '../utils/gitHubUtils';
import { localize } from '../utils/localize';
import { nonNullProp } from '../utils/nonNull';

const createNewRepo: string = 'createNewRepo';
export class GitHubRepoListStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {

    public async prompt(context: IStaticWebAppWizardContext): Promise<void> {
        const placeHolder: string = localize('chooseRepo', 'Choose repository');
        let repoData: gitHubRepoData | undefined;
        let quickPickItems: IAzureQuickPickItem<gitHubRepoData | undefined>[] = [];
        const picksCache: ICachedQuickPicks<gitHubRepoData> = { picks: [] };
        quickPickItems.push({ label: localize(createNewRepo, '$(plus) Create a new GitHub repository...'), data: { name: createNewRepo, repos_url: createNewRepo, html_url: createNewRepo, url: createNewRepo } });
        quickPickItems = quickPickItems.concat(await this.getRepositories(context, picksCache));

        do {
            repoData = (await ext.ui.showQuickPick(quickPickItems, { placeHolder })).data;
        } while (!repoData);

        context.repoData = repoData;
        context.repoHtmlUrl = repoData.html_url;
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

    private async getRepositories(context: IStaticWebAppWizardContext, picksCache: ICachedQuickPicks<gitHubRepoData>): Promise<IAzureQuickPickItem<gitHubRepoData | undefined>[]> {
        const requestOptions: gitHubWebResource = await createGitHubRequestOptions(context, nonNullProp(context, 'orgData').repos_url);
        return await getGitHubQuickPicksWithLoadMore<gitHubRepoData>(picksCache, requestOptions, 'name');
    }
}
