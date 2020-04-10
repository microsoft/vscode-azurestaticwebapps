/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { workspace } from "vscode";
import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, IActionContext } from "vscode-azureextensionui";
import { GitHubOrgListStep } from "../github/GitHubOrgListStep";
import { IGitHubAccessTokenContext } from "../IGitHubAccessTokenContext";
import { getGitHubAccessToken } from "../utils/gitHubUtils";
import { localize } from "../utils/localize";
import { INewEndpointWizardContext } from "./createNewEndpoint/INewEndpointWizardContext";
import { RepoCreateStep } from "./createNewEndpoint/RepoCreateStep";
import { RepoNameStep } from "./createNewEndpoint/RepoNameStep";

export async function createGitHubRepo(context: IActionContext): Promise<void> {
    if (!workspace.workspaceFolders || workspace.workspaceFolders.length <= 0) {
        throw new Error();
    }

    const wizardContext: INewEndpointWizardContext = { ...context, projectFsPath: workspace.workspaceFolders[0].uri.fsPath };
    const title: string = localize('connectGitHubRepo', 'Create new endpoint');

    const promptSteps: AzureWizardPromptStep<IGitHubAccessTokenContext>[] = [new GitHubOrgListStep(), new RepoNameStep()];
    const executeSteps: AzureWizardExecuteStep<INewEndpointWizardContext>[] = [new RepoCreateStep()];

    const wizard: AzureWizard<INewEndpointWizardContext> = new AzureWizard(wizardContext, {
        title,
        promptSteps,
        executeSteps
    });

    await wizard.prompt();
    // get the token if we never did
    wizardContext.accessToken = wizardContext.accessToken ? wizardContext.accessToken : await getGitHubAccessToken();
    await wizard.execute();
}
