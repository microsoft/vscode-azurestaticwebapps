/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IAzureQuickPickItem } from 'vscode-azureextensionui';
import { githubApiEndpoint } from '../../constants';
import { ext } from '../../extensionVariables';
import { createGitHubRequestOptions, getGitHubQuickPicksWithLoadMore, getRepoFullname, gitHubBranchData, gitHubWebResource, ICachedQuickPicks } from '../../utils/gitHubUtils';
import { localize } from '../../utils/localize';
import { nonNullProp } from '../../utils/nonNull';
import { IStaticWebAppWizardContext } from './IStaticWebAppWizardContext';

export class GitHubBranchListStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    public async prompt(context: IStaticWebAppWizardContext): Promise<void> {
        let branchData: gitHubBranchData | undefined;
        const { owner, name } = getRepoFullname(nonNullProp(context, 'repoHtmlUrl'));
        const placeHolder: string = localize('chooseBranch', 'Choose branch for repository "{0}/{1}"', owner, name);

        const requestOption: gitHubWebResource = await createGitHubRequestOptions(context, `${githubApiEndpoint}/repos/${owner}/${name}/branches`);
        const picksCache: ICachedQuickPicks<gitHubBranchData> = { picks: [] };
        do {
            branchData = (await ext.ui.showQuickPick(this.getBranchPicks(requestOption, picksCache), { placeHolder })).data;
        } while (!branchData);

        context.branchData = branchData;
    }

    public shouldPrompt(context: IStaticWebAppWizardContext): boolean {
        return !context.branchData;
    }

    private async getBranchPicks(requestOption: gitHubWebResource, picksCache: ICachedQuickPicks<gitHubBranchData>): Promise<IAzureQuickPickItem<gitHubBranchData | undefined>[]> {
        return await getGitHubQuickPicksWithLoadMore<gitHubBranchData>(picksCache, requestOption, 'name');
    }
}
