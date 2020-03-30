/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, IActionContext } from "vscode-azureextensionui";
import { GitHubOrgListStep } from "../../github/GitHubOrgListStep";
import { localize } from "../../utils/localize";
import { INewEndpointWizardContext } from "./INewEndpointWizardContext";
import { RepoCreateStep } from "./RepoCreateStep";
import { RepoNameStep } from "./RepoNameStep";

export async function createNewEndpoint(context: IActionContext): Promise<void> {
    const wizardContext: INewEndpointWizardContext = { ...context };
    const title: string = localize('connectGitHubRepo', 'Create new endpoint');

    const promptSteps: AzureWizardPromptStep<INewEndpointWizardContext>[] = [new GitHubOrgListStep(), new RepoNameStep()];
    const executeSteps: AzureWizardExecuteStep<INewEndpointWizardContext>[] = [new RepoCreateStep()];

    const wizard: AzureWizard<INewEndpointWizardContext> = new AzureWizard(wizardContext, {
        title,
        promptSteps,
        executeSteps
    });

    await wizard.prompt();
    await wizard.execute();
}
