/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Progress } from 'vscode';
import { AzureWizardExecuteStep } from "vscode-azureextensionui";
import { githubApiEndpoint } from '../../constants';
import { ext } from '../../extensionVariables';
import { createGitHubRequestOptions, gitHubRepoData, gitHubWebResource, isUser } from "../../utils/gitHubUtils";
import { localize } from '../../utils/localize';
import { nonNullProp } from '../../utils/nonNull';
import { requestUtils } from '../../utils/requestUtils';
import { IStaticWebAppWizardContext } from './IStaticWebAppWizardContext';

export class RepoCreateStep extends AzureWizardExecuteStep<IStaticWebAppWizardContext> {
    public priority: number = 200;

    public async execute(wizardContext: IStaticWebAppWizardContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const creatingGitHubRepo: string = localize('creatingGitHubRepo', 'Creating new GitHub repository "{0}"', wizardContext.newRepoName);
        ext.outputChannel.appendLog(creatingGitHubRepo);
        progress.report({ message: creatingGitHubRepo });

        const requestOption: gitHubWebResource = await createGitHubRequestOptions(wizardContext.accessToken, isUser(wizardContext.orgData) ? `${githubApiEndpoint}/user/repos` : nonNullProp(wizardContext, 'orgData').repos_url, 'POST');
        requestOption.body = JSON.stringify({ name: wizardContext.newRepoName });

        const gitHubRepoRes: gitHubRepoData = <gitHubRepoData>JSON.parse((await requestUtils.sendRequest<{ body: string }>(requestOption)).body);
        wizardContext.repoHtmlUrl = gitHubRepoRes.html_url;

        const createdGitHubRepo: string = localize('createdGitHubRepo', 'Created new GitHub repository "{0}"', wizardContext.newRepoName);
        ext.outputChannel.appendLog(createdGitHubRepo);
        progress.report({ message: createdGitHubRepo });
    }

    public shouldExecute(wizardContext: IStaticWebAppWizardContext): boolean {
        return !!(wizardContext.accessToken && wizardContext.newRepoName);
    }

}
