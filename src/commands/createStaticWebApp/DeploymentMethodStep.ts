/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IAzureQuickPickItem, IWizardOptions } from "vscode-azureextensionui";
import { ext } from "../../extensionVariables";
import { localize } from "../../utils/localize";
import { openUrl } from "../../utils/openUrl";
import { RepoCreateStep } from "../createRepo/RepoCreateStep";
import { WorkspaceListStep } from "../createRepo/WorkspaceListStep";
import { GitHubBranchListStep } from "./GitHubBranchListStep";
import { GitHubOrgListStep } from "./GitHubOrgListStep";
import { GitHubRepoListStep } from "./GitHubRepoListStep";
import { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";

export type DeploymentMethods = 'local' | 'existingRepo' | 'learnMore';

export class DeploymentMethodStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    public async prompt(wizardContext: IStaticWebAppWizardContext): Promise<void> {
        const localCode: IAzureQuickPickItem<DeploymentMethods> = { label: localize('local', '$(cloud-upload) Publish local code to a new GitHub repository'), data: 'local' };
        const existingRepo: IAzureQuickPickItem<DeploymentMethods> = { label: localize('existingRepo', '$(github) Use existing GitHub repository'), data: 'existingRepo' };

        const placeHolder: string = localize('createMethod', "How do you want to create a static web app?");
        const learnMore: IAzureQuickPickItem<DeploymentMethods> = { label: localize('learnMore', '$(book) Learn more...'), data: 'learnMore' };
        let pick: DeploymentMethods;

        do {
            pick = (await ext.ui.showQuickPick([localCode, existingRepo, learnMore], { placeHolder, suppressPersistence: true })).data;
            if (pick === learnMore.data) {
                await openUrl('https://aka.ms/AAaee7c');
            }
        } while (pick === learnMore.data);

        wizardContext.deploymentMethod = pick;
    }

    public shouldPrompt(wizardContext: IStaticWebAppWizardContext): boolean {
        return !wizardContext.apiLocation;
    }

    public async getSubWizard(wizardContext: IStaticWebAppWizardContext): Promise<IWizardOptions<IStaticWebAppWizardContext> | undefined> {
        const promptSteps: AzureWizardPromptStep<IStaticWebAppWizardContext>[] = [];
        if (wizardContext.deploymentMethod === 'existingRepo') {
            promptSteps.push(new GitHubOrgListStep());
            promptSteps.push(new GitHubRepoListStep());
            promptSteps.push(new GitHubBranchListStep());
            return { promptSteps };
        } else {
            promptSteps.push(new WorkspaceListStep());
            return { promptSteps, executeSteps: [new RepoCreateStep()] };
        }
    }
}
