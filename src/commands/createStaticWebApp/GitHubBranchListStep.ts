/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit, RestEndpointMethodTypes } from '@octokit/rest';
import { AzureWizardPromptStep, IAzureQuickPickItem } from 'vscode-azureextensionui';
import { ext } from '../../extensionVariables';
import { BranchData } from '../../gitHubTypings';
import { getGitHubQuickPicksWithLoadMore, getGitHubTree, getRepoFullname, ICachedQuickPicks } from '../../utils/gitHubUtils';
import { localize } from '../../utils/localize';
import { nonNullProp, nonNullValueAndProp } from '../../utils/nonNull';
import { createOctokitClient } from '../github/createOctokitClient';
import { IStaticWebAppWizardContext } from './IStaticWebAppWizardContext';

type ReposListBranchesParameters = RestEndpointMethodTypes['repos']['listBranches']['parameters'];

export class GitHubBranchListStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    public async prompt(context: IStaticWebAppWizardContext): Promise<void> {
        let branchData: BranchData | undefined;
        const { owner, name } = getRepoFullname(nonNullProp(context, 'repoHtmlUrl'));
        const placeHolder: string = localize('chooseBranch', 'Choose branch for repository "{0}/{1}"', owner, name);
        const picksCache: ICachedQuickPicks<BranchData> = { picks: [] };
        const params: ReposListBranchesParameters = { repo: name, owner };

        do {
            branchData = (await ext.ui.showQuickPick(this.getBranchPicks(context, params, picksCache), { placeHolder })).data;
        } while (!branchData);

        context.branchData = branchData;

        context.gitTreeDataTask = getGitHubTree(nonNullProp(context, 'repoHtmlUrl'), nonNullValueAndProp(context.branchData, 'name'));
    }

    public shouldPrompt(context: IStaticWebAppWizardContext): boolean {
        return !context.branchData;
    }

    private async getBranchPicks(context: IStaticWebAppWizardContext, params: ReposListBranchesParameters, picksCache: ICachedQuickPicks<BranchData>): Promise<IAzureQuickPickItem<BranchData | undefined>[]> {
        const client: Octokit = await createOctokitClient(context.accessToken);
        const picks: IAzureQuickPickItem<BranchData | undefined>[] = await getGitHubQuickPicksWithLoadMore<BranchData, ReposListBranchesParameters>(picksCache, client.repos.listBranches, params, 'name');
        const noBranch: string = localize('noBranch', ' $(stop) No branches detected. Go back to select a different repository or create a remote branch');
        return picks.length > 0 ? picks : [{ label: noBranch, data: undefined }];
    }
}
