/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// tslint:disable-next-line:no-submodule-imports
import * as git from 'simple-git/promise';
import { Progress } from 'vscode';
import { AzureWizardExecuteStep } from "vscode-azureextensionui";
import { githubApiEndpoint, gitHubOrgDataSetting, repoBranchSetting, repoDataSetting } from '../../constants';
import { createGitHubRequestOptions, gitHubRepoData, gitHubWebResource } from "../../github/connectToGitHub";
import { requestUtils } from '../../utils/requestUtils';
import { updateWorkspaceSetting } from '../../utils/vsCodeConfig/settings';
import { INewEndpointWizardContext } from "./INewEndpointWizardContext";

export class RepoCreateStep extends AzureWizardExecuteStep<INewEndpointWizardContext> {
    public priority: number = 200;

    public async execute(wizardContext: INewEndpointWizardContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        progress.report({ message: 'Creating new github repo' });
        const requestOption: gitHubWebResource = await createGitHubRequestOptions(wizardContext, `${githubApiEndpoint}/user/repos`, 'POST');
        requestOption.body = JSON.stringify({ name: wizardContext.newRepoName });
        const gitHubRepoRes: gitHubRepoData = <gitHubRepoData>JSON.parse((await requestUtils.sendRequest<{ body: string }>(requestOption)).body);
        progress.report({ message: 'Created new github repo' });

        const localGit: git.SimpleGit = git(wizardContext.projectFsPath);
        await localGit.push(gitHubRepoRes.clone_url, gitHubRepoRes.default_branch);

        await updateWorkspaceSetting(gitHubOrgDataSetting, { login: wizardContext.orgData?.login, repos_url: wizardContext.orgData?.repos_url }, wizardContext.projectFsPath);
        await updateWorkspaceSetting(repoDataSetting, { name: gitHubRepoRes.name, html_url: gitHubRepoRes.html_url, url: gitHubRepoRes.url, repos_url: gitHubRepoRes.repos_url }, wizardContext.projectFsPath);
        await updateWorkspaceSetting(repoBranchSetting, { name: gitHubRepoRes.default_branch }, wizardContext.projectFsPath);
    }

    public shouldExecute(wizardContext: INewEndpointWizardContext): boolean {
        return !!(wizardContext.accessToken && wizardContext.newRepoName);
    }

}
