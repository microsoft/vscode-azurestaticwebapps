/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit } from '@octokit/rest';
import { Progress } from 'vscode';
import { AzureWizardExecuteStep } from "vscode-azureextensionui";
import { ext } from '../../extensionVariables';
import { Branch, Repository } from '../../git';
import { isUser } from "../../utils/gitHubUtils";
import { callWithGitErrorHandling } from '../../utils/gitUtils';
import { localize } from '../../utils/localize';
import { nonNullProp } from '../../utils/nonNull';
import { IStaticWebAppWizardContext } from '../createStaticWebApp/IStaticWebAppWizardContext';
import { createOctokitClient } from '../github/createOctokitClient';

export class RepoCreateStep extends AzureWizardExecuteStep<IStaticWebAppWizardContext> {
    // should happen before resource group create step
    public priority: number = 90;

    public async execute(wizardContext: IStaticWebAppWizardContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const newRepoName: string = nonNullProp(wizardContext, 'newRepoName');
        const newRepoIsPrivate: boolean = nonNullProp(wizardContext, 'newRepoIsPrivate');
        const creatingGitHubRepo: string = newRepoIsPrivate ? localize('creatingPrivateGitHubRepo', 'Creating new private GitHub repository "{0}"...', newRepoName) :
            localize('creatingPublicGitHubRepo', 'Creating new public GitHub repository "{0}"...', newRepoName);
        ext.outputChannel.appendLog(creatingGitHubRepo);
        progress.report({ message: creatingGitHubRepo });

        const client: Octokit = await createOctokitClient(wizardContext);
        const gitHubRepoRes = (isUser(wizardContext.orgData) ? await client.repos.createForAuthenticatedUser({ name: newRepoName, private: newRepoIsPrivate }) :
            await client.repos.createInOrg({ org: nonNullProp(wizardContext, 'orgData').login, name: newRepoName, private: newRepoIsPrivate })).data;
        wizardContext.repoHtmlUrl = gitHubRepoRes.html_url;

        const createdGitHubRepo: string = newRepoIsPrivate ? localize('createdPrivateGitHubRepo', 'Created new private GitHub repository "{0}".', newRepoName) :
            localize('createdPublicGitHubRepo', 'Created new public GitHub repository "{0}".', newRepoName);
        ext.outputChannel.appendLog(createdGitHubRepo);
        progress.report({ message: createdGitHubRepo });

        const repo: Repository = nonNullProp(wizardContext, 'repo');
        const remoteName: string = nonNullProp(wizardContext, 'newRemoteShortname');
        await callWithGitErrorHandling(async () => await repo.addRemote(remoteName, gitHubRepoRes.clone_url));
        const branch: Branch = await repo.getBranch('HEAD');

        const pushingBranch: string = localize('pushingBranch', 'Pushing local branch "{0}" to GitHub repository "{1}"...', branch.name, wizardContext.newRepoName);
        ext.outputChannel.appendLog(pushingBranch);
        progress.report({ message: pushingBranch });
        await callWithGitErrorHandling(async () => await repo.push(remoteName, branch.name, true));

        const pushedBranch: string = localize('pushedBranch', 'Pushed local branch "{0}" to GitHub repository "{1}".', branch.name, wizardContext.newRepoName);
        ext.outputChannel.appendLog(pushedBranch);
        progress.report({ message: pushedBranch });

        wizardContext.branchData = (await client.repos.getBranch({ repo: newRepoName, owner: nonNullProp(wizardContext, 'orgData').login, branch: nonNullProp(branch, 'name') })).data;
    }

    public shouldExecute(wizardContext: IStaticWebAppWizardContext): boolean {
        return !!(wizardContext.accessToken && wizardContext.newRepoName);
    }
}
