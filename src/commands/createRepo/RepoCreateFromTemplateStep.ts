/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Progress } from 'vscode';
import { AzureWizardExecuteStep } from "vscode-azureextensionui";
import { ext } from '../../extensionVariables';
import { RepoData } from '../../gitHubTypings';
import { createRepoFromTemplate } from "../../utils/gitHubUtils";
import { localize } from '../../utils/localize';
import { nonNullProp } from '../../utils/nonNull';
import { IStaticWebAppWizardContext } from '../createStaticWebApp/IStaticWebAppWizardContext';

export class RepoCreateFromTemplateStep extends AzureWizardExecuteStep<IStaticWebAppWizardContext> {
    // should happen before resource group create step
    public priority: number = 90;

    public async execute(context: IStaticWebAppWizardContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const newRepoName: string = nonNullProp(context, 'newRepoName');
        const newRepoIsPrivate: boolean = nonNullProp(context, 'newRepoIsPrivate');
        const templateRepo: RepoData = nonNullProp(context, 'templateRepo');

        const creatingGitHubRepo: string = newRepoIsPrivate ? localize('creatingPrivateGitHubRepo', 'Creating new private GitHub repository "{0}" from template "{1}"...', newRepoName, templateRepo.full_name) :
            localize('creatingPublicGitHubRepo', 'Creating new public GitHub repository "{0}" from template {1}...', newRepoName, templateRepo.full_name);
        ext.outputChannel.appendLog(creatingGitHubRepo);
        progress.report({ message: creatingGitHubRepo });

        const gitHubRepoRes = (await createRepoFromTemplate(context, templateRepo, newRepoName, newRepoIsPrivate)).data;

        context.repoHtmlUrl = gitHubRepoRes.html_url;
        context.branchData = { name: gitHubRepoRes.default_branch };

        const createdGitHubRepo: string = newRepoIsPrivate ? localize('createdPrivateGitHubRepo', 'Created new private GitHub repository "{0}".', newRepoName) :
            localize('createdPublicGitHubRepo', 'Created new public GitHub repository "{0}".', newRepoName);
        ext.outputChannel.appendLog(createdGitHubRepo);
        progress.report({ message: createdGitHubRepo });
    }

    public shouldExecute(context: IStaticWebAppWizardContext): boolean {
        return !!(context.accessToken && context.newRepoName);
    }
}
