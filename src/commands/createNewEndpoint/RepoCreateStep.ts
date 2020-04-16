/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Progress } from 'vscode';
import { AzureWizardExecuteStep } from "vscode-azureextensionui";
import { githubApiEndpoint } from '../../constants';
import { createGitHubRequestOptions, gitHubWebResource } from "../../utils/gitHubUtils";
import { requestUtils } from '../../utils/requestUtils';
import { IStaticSiteWizardContext } from '../createStaticWebApp/IStaticSiteWizardContext';

export class RepoCreateStep extends AzureWizardExecuteStep<IStaticSiteWizardContext> {
    public priority: number = 200;

    public async execute(wizardContext: IStaticSiteWizardContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        progress.report({ message: 'Creating new github repo' });
        const requestOption: gitHubWebResource = await createGitHubRequestOptions(wizardContext, `${githubApiEndpoint}/user/repos`, 'POST');
        requestOption.body = JSON.stringify({ name: wizardContext.newRepoName });
        await requestUtils.sendRequest<{ body: string }>(requestOption);
        progress.report({ message: 'Created new github repo' });
    }

    public shouldExecute(wizardContext: IStaticSiteWizardContext): boolean {
        return !!(wizardContext.accessToken && wizardContext.newRepoName);
    }

}
