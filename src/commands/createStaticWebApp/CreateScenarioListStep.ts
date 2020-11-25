/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { workspace } from "vscode";
import { AzureWizardPromptStep, IAzureQuickPickItem, IWizardOptions } from "vscode-azureextensionui";
import { ext } from "../../extensionVariables";
import { getGitApi } from "../../getExtensionApi";
import { localize } from "../../utils/localize";
import { openUrl } from "../../utils/openUrl";
import { GitignoreListStep } from "../createRepo/GitignoreListStep";
import { RemoteShortnameStep } from "../createRepo/RemoteShortnameStep";
import { RepoCreateStep } from "../createRepo/RepoCreateStep";
import { RepoNameStep } from "../createRepo/RepoNameStep";
import { RepoPrivacyStep } from "../createRepo/RepoPrivacyStep";
import { WorkspaceListStep } from "../createRepo/WorkspaceListStep";
import { GitHubBranchListStep } from "./GitHubBranchListStep";
import { GitHubOrgListStep } from "./GitHubOrgListStep";
import { GitHubRepoListStep } from "./GitHubRepoListStep";
import { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";

export type CreateScenario = 'publishToNewRepo' | 'connectToExistingRepo';

export class CreateScenarioListStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    public hideStepCount: boolean = true;

    public async prompt(wizardContext: IStaticWebAppWizardContext): Promise<void> {

        const localCode: IAzureQuickPickItem<CreateScenario> = { label: localize('local', '$(cloud-upload) Publish local code to a new GitHub repository'), data: 'publishToNewRepo' };
        const existingRepo: IAzureQuickPickItem<CreateScenario> = { label: localize('existingRepo', '$(github) Use existing GitHub repository'), data: 'connectToExistingRepo' };

        const placeHolder: string = localize('createMethod', "How do you want to create a static web app?");
        const learnMore: IAzureQuickPickItem<CreateScenario | undefined> = { label: localize('learnMore', '$(book) Learn more...'), data: undefined };
        let pick: CreateScenario | undefined;

        do {
            pick = (await ext.ui.showQuickPick([localCode, existingRepo, learnMore], { placeHolder, suppressPersistence: true })).data;
            if (pick === learnMore.data) {
                await openUrl('https://aka.ms/AAaee7c');
            }
        } while (!pick);

        wizardContext.createScenario = pick;
    }

    public shouldPrompt(wizardContext: IStaticWebAppWizardContext): boolean {
        if (!wizardContext.createScenario && wizardContext.repoHtmlUrl && !wizardContext.advancedCreation) {
            wizardContext.createScenario = 'connectToExistingRepo';
        }

        return !wizardContext.createScenario;
    }

    public async getSubWizard(wizardContext: IStaticWebAppWizardContext): Promise<IWizardOptions<IStaticWebAppWizardContext> | undefined> {
        const promptSteps: AzureWizardPromptStep<IStaticWebAppWizardContext>[] = [new GitHubOrgListStep()];
        if (wizardContext.createScenario === 'publishToNewRepo') {
            // calling to verify the user has git enabled so they don't go through the whole process and then it fails
            await getGitApi();
            if (workspace.workspaceFolders && workspace.workspaceFolders.length === 1 && !wizardContext.advancedCreation) {
                // only one workspace folder, in basic mode, set that as local cod
                wizardContext.fsPath = workspace.workspaceFolders[0].uri.fsPath;
                await WorkspaceListStep.setWorkspaceContexts(wizardContext, wizardContext.fsPath);
            } else {
                promptSteps.push(new WorkspaceListStep());
            }

            promptSteps.push(new RepoNameStep(), new RepoPrivacyStep(), new RemoteShortnameStep(), new GitignoreListStep());
            return { promptSteps, executeSteps: [new RepoCreateStep()] };
        } else {
            promptSteps.push(new GitHubRepoListStep(), new GitHubBranchListStep());
            return { promptSteps };
        }
    }
}
