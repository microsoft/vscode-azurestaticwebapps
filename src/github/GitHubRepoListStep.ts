/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IAzureQuickPickItem } from 'vscode-azureextensionui';
import { IStaticSiteWizardContext } from '../commands/createStaticWebApp/IStaticSiteWizardContext';
import { ext } from '../extensionVariables';
import { localize } from '../utils/localize';
import { nonNullProp } from '../utils/nonNull';
import { createGitHubRequestOptions, getGitHubQuickPicksWithLoadMore, gitHubRepoData, gitHubWebResource, ICachedQuickPicks } from './connectToGitHub';

export class GitHubRepoListStep extends AzureWizardPromptStep<IStaticSiteWizardContext> {
    public async prompt(context: IStaticSiteWizardContext): Promise<void> {
        const placeHolder: string = localize('chooseRepo', 'Choose repository');
        let repoData: gitHubRepoData | undefined;
        const picksCache: ICachedQuickPicks<gitHubRepoData> = { picks: [] };
        do {
            repoData = (await ext.ui.showQuickPick(this.getRepositories(context, picksCache), { placeHolder })).data;
        } while (!repoData);

        context.repoData = repoData;
    }

    public shouldPrompt(context: IStaticSiteWizardContext): boolean {
        return !context.repoData;
    }

    private async getRepositories(context: IStaticSiteWizardContext, picksCache: ICachedQuickPicks<gitHubRepoData>): Promise<IAzureQuickPickItem<gitHubRepoData | undefined>[]> {
        const requestOptions: gitHubWebResource = await createGitHubRequestOptions(context, nonNullProp(context, 'orgData').repos_url);
        return await getGitHubQuickPicksWithLoadMore<gitHubRepoData>(picksCache, requestOptions, 'name');
    }
}
