/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit } from '@octokit/rest';
import { ReposCreateForAuthenticatedUserResponseData, ReposCreateInOrgResponseData } from '@octokit/types';
import { Progress } from 'vscode';
import { AzureWizardExecuteStep } from "vscode-azureextensionui";
import { ext } from '../../extensionVariables';
import { isUser } from "../../utils/gitHubUtils";
import { localize } from '../../utils/localize';
import { nonNullProp } from '../../utils/nonNull';
import { createOctokitClient } from '../github/createOctokitClient';
import { IStaticWebAppWizardContext } from './IStaticWebAppWizardContext';

type RepoCreateData = ReposCreateForAuthenticatedUserResponseData | ReposCreateInOrgResponseData;
export class RepoCreateStep extends AzureWizardExecuteStep<IStaticWebAppWizardContext> {
    public priority: number = 200;

    public async execute(wizardContext: IStaticWebAppWizardContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const creatingGitHubRepo: string = localize('creatingGitHubRepo', 'Creating new GitHub repository "{0}"', wizardContext.newRepoName);
        ext.outputChannel.appendLog(creatingGitHubRepo);
        progress.report({ message: creatingGitHubRepo });

        const name: string = nonNullProp(wizardContext, 'newRepoName');

        const client: Octokit = await createOctokitClient(wizardContext.accessToken);
        const gitHubRepoRes: RepoCreateData = (isUser(wizardContext.orgData) ? await client.repos.createForAuthenticatedUser({ name }) : await client.repos.createInOrg({ org: nonNullProp(wizardContext, 'orgData').login, name })).data;
        wizardContext.repoHtmlUrl = gitHubRepoRes.html_url;

        const createdGitHubRepo: string = localize('createdGitHubRepo', 'Created new GitHub repository "{0}"', wizardContext.newRepoName);
        ext.outputChannel.appendLog(createdGitHubRepo);
        progress.report({ message: createdGitHubRepo });
    }

    public shouldExecute(wizardContext: IStaticWebAppWizardContext): boolean {
        return !!(wizardContext.accessToken && wizardContext.newRepoName);
    }

}
