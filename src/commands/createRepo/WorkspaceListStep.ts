/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fse from 'fs-extra';
import { join } from 'path';
import { AzureWizardPromptStep } from 'vscode-azureextensionui';
import { remoteShortnameExists } from '../../utils/gitHubUtils';
import { localize } from '../../utils/localize';
import { selectWorkspaceFolder } from '../../utils/workspaceUtils';
import { IStaticWebAppWizardContext } from '../createStaticWebApp/IStaticWebAppWizardContext';

export class WorkspaceListStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    public hideStepCount: boolean = true;

    public static async setWorkspaceContexts(wizardContext: IStaticWebAppWizardContext, fsPath: string): Promise<void> {
        const origin: string = 'origin';
        wizardContext.originExists = await remoteShortnameExists(fsPath, origin);
        wizardContext.newRemoteShortname = wizardContext.originExists ? undefined : origin;
        const gitignorePath: string = join(fsPath, '.gitignore');
        wizardContext.gitignoreExists = await fse.pathExists(gitignorePath);
    }

    public async prompt(wizardContext: IStaticWebAppWizardContext): Promise<void> {
        const selectProject: string = localize('selectProject', 'Select a project to create the new repository');
        wizardContext.fsPath = await selectWorkspaceFolder(selectProject);
        await WorkspaceListStep.setWorkspaceContexts(wizardContext, wizardContext.fsPath);

    }

    public shouldPrompt(wizardContext: IStaticWebAppWizardContext): boolean {
        return !wizardContext.fsPath || !!wizardContext.advancedCreation;
    }
}
