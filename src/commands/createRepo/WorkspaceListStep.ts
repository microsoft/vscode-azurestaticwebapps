/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IWizardOptions } from 'vscode-azureextensionui';
import { remoteShortnameExists } from '../../utils/gitHubUtils';
import { localize } from '../../utils/localize';
import { selectWorkspaceFolder } from '../../utils/workspaceUtils';
import { GitHubOrgListStep } from '../createStaticWebApp/GitHubOrgListStep';
import { IStaticWebAppWizardContext } from '../createStaticWebApp/IStaticWebAppWizardContext';
import { GitignoreListStep } from './GitignoreListStep';
import { RemoteShortnameStep } from './RemoteShortnameStep';
import { RepoNameStep } from './RepoNameStep';
import { RepoPrivacyStep } from './RepoPrivacyStep';

export class WorkspaceListStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    public async prompt(wizardContext: IStaticWebAppWizardContext): Promise<void> {
        const selectProject: string = localize('selectProject', 'Select a project to create the new repository');
        wizardContext.fsPath = await selectWorkspaceFolder(selectProject);
        wizardContext.hasOrigin = await remoteShortnameExists(wizardContext.fsPath, 'origin');
    }

    public shouldPrompt(wizardContext: IStaticWebAppWizardContext): boolean {
        return !wizardContext.fsPath || !!wizardContext.advancedCreation;
    }

    public async getSubWizard(_wizardContext: IStaticWebAppWizardContext): Promise<IWizardOptions<IStaticWebAppWizardContext> | undefined> {
        // some shouldPrompts depend on having a workspace, so put all of the steps as a subwizard instead
        const promptSteps: AzureWizardPromptStep<IStaticWebAppWizardContext>[] = [];
        promptSteps.push(new GitHubOrgListStep(), new RepoNameStep(), new RepoPrivacyStep(), new RemoteShortnameStep(), new GitignoreListStep());
        return { promptSteps };
    }
}
