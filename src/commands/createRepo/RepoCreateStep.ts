/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit } from '@octokit/rest';
import { ReposCreateForAuthenticatedUserResponseData, ReposCreateInOrgResponseData } from '@octokit/types';
import { Progress } from 'vscode';
import { AzureWizardExecuteStep } from "vscode-azureextensionui";
import { ext } from '../../extensionVariables';
import { Branch, Repository } from '../../git';
import { isUser } from "../../utils/gitHubUtils";
import { localize } from '../../utils/localize';
import { nonNullProp } from '../../utils/nonNull';
import { IStaticWebAppWizardContext } from '../createStaticWebApp/IStaticWebAppWizardContext';
import { createOctokitClient } from '../github/createOctokitClient';

type RepoCreateData = ReposCreateForAuthenticatedUserResponseData | ReposCreateInOrgResponseData;
export class RepoCreateStep extends AzureWizardExecuteStep<IStaticWebAppWizardContext> {
    // should happen before resource group create step
    public priority: number = 90;

    public async execute(wizardContext: IStaticWebAppWizardContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const newRepoName: string = nonNullProp(wizardContext, 'newRepoName');
        const newRepoPrivacy: boolean = nonNullProp(wizardContext, 'newRepoPrivacy');
        const privacy: string = newRepoPrivacy ? 'private' : 'public';
        const creatingGitHubRepo: string = localize('creatingGitHubRepo', 'Creating new {0} GitHub repository "{1}"', privacy, newRepoName);
        ext.outputChannel.appendLog(creatingGitHubRepo);
        progress.report({ message: creatingGitHubRepo });

        const repo: Repository = nonNullProp(wizardContext, 'repo');
        if (!repo.state.HEAD?.commit) {
            // needs to have an initial commit
            await repo.commit(localize('initCommit', 'Initial commit'), { all: true });
        }

        const client: Octokit = await createOctokitClient(wizardContext.accessToken);
        const gitHubRepoRes: RepoCreateData = (isUser(wizardContext.orgData) ? await client.repos.createForAuthenticatedUser({ name: newRepoName, private: newRepoPrivacy }) :
            await client.repos.createInOrg({ org: nonNullProp(wizardContext, 'orgData').login, name: newRepoName, private: newRepoPrivacy })).data;
        wizardContext.repoHtmlUrl = gitHubRepoRes.html_url;

        const remoteName: string = nonNullProp(wizardContext, 'newRemoteShortname');
        await repo.addRemote(remoteName, gitHubRepoRes.clone_url);
        const branch: Branch = await repo.getBranch('HEAD');
        await repo.push(remoteName, branch.name, true);

        const createdGitHubRepo: string = localize('createdGitHubRepo', 'Created new {0} GitHub repository "{1}"', privacy, newRepoName);
        ext.outputChannel.appendLog(createdGitHubRepo);
        progress.report({ message: createdGitHubRepo });

        wizardContext.branchData = (await client.repos.getBranch({ repo: newRepoName, owner: nonNullProp(wizardContext, 'orgData').login, branch: nonNullProp(branch, 'name') })).data;
    }

    public shouldExecute(wizardContext: IStaticWebAppWizardContext): boolean {
        return !!(wizardContext.accessToken && wizardContext.newRepoName);
    }
}
