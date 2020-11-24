/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { workspace } from "vscode";
import { AzureWizardPromptStep, IAzureQuickPickItem, IWizardOptions } from "vscode-azureextensionui";
import { ext } from "../../extensionVariables";
import { getGitApi } from '../../getExtensionApi';
import { remoteShortnameExists } from '../../utils/gitHubUtils';
import { localize } from "../../utils/localize";
import { openUrl } from "../../utils/openUrl";
import { RepoCreateStep } from "../createRepo/RepoCreateStep";
import { WorkspaceListStep } from "../createRepo/WorkspaceListStep";
import { GitHubBranchListStep } from "./GitHubBranchListStep";
import { GitHubOrgListStep } from "./GitHubOrgListStep";
import { GitHubRepoListStep } from "./GitHubRepoListStep";
import { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";

export type CreateScenario = 'publishToNewRepo' | 'connectToExistingRepo';

export class CreateMethodStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
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
        return !wizardContext.createScenario;
    }

    public async getSubWizard(wizardContext: IStaticWebAppWizardContext): Promise<IWizardOptions<IStaticWebAppWizardContext> | undefined> {
        const promptSteps: AzureWizardPromptStep<IStaticWebAppWizardContext>[] = [];
        if (wizardContext.createScenario === 'connectToExistingRepo') {
            promptSteps.push(new GitHubOrgListStep());
            promptSteps.push(new GitHubRepoListStep());
            promptSteps.push(new GitHubBranchListStep());
            return { promptSteps };
        } else {
            // calling to verify the user has git enabled so they don't go through the whole process and then it fails
            await getGitApi();
            if (workspace.workspaceFolders && workspace.workspaceFolders.length === 1 && !wizardContext.advancedCreation) {
                // only one workspace folder, in basic mode, set that as local code
                wizardContext.fsPath = workspace.workspaceFolders[0].uri.fsPath;
                wizardContext.hasOrigin = await remoteShortnameExists(wizardContext.fsPath, 'origin');
            }

            promptSteps.push(new WorkspaceListStep());
            return { promptSteps, executeSteps: [new RepoCreateStep()] };
        }
    }
}
