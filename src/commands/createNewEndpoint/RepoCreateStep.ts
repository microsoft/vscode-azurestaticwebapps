/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Progress } from 'vscode';
import { AzureWizardExecuteStep } from "vscode-azureextensionui";
import { githubApiEndpoint } from '../../constants';
import { createGitHubRequestOptions, gitHubRepoData, gitHubWebResource, pushRepoToRemote } from "../../utils/gitHubUtils";
import { nonNullProp } from '../../utils/nonNull';
import { requestUtils } from '../../utils/requestUtils';
import { INewEndpointWizardContext } from "./INewEndpointWizardContext";

export class RepoCreateStep extends AzureWizardExecuteStep<INewEndpointWizardContext> {
    public priority: number = 200;

    public async execute(wizardContext: INewEndpointWizardContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        progress.report({ message: 'Creating new github repo' });
        const requestOption: gitHubWebResource = await createGitHubRequestOptions(wizardContext, `${githubApiEndpoint}/user/repos`, 'POST');
        requestOption.body = JSON.stringify({ name: wizardContext.newRepoName });
        const gitHubRepoRes: gitHubRepoData = <gitHubRepoData>JSON.parse((await requestUtils.sendRequest<{ body: string }>(requestOption)).body);
        progress.report({ message: 'Created new github repo' });

        await pushRepoToRemote(wizardContext.projectFsPath, nonNullProp(gitHubRepoRes, 'clone_url'), nonNullProp(gitHubRepoRes, 'default_branch'));
    }

    public shouldExecute(wizardContext: INewEndpointWizardContext): boolean {
        return !!(wizardContext.accessToken && wizardContext.newRepoName);
    }

}
