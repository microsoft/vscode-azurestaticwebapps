/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Progress } from 'vscode';
import { AzureWizardExecuteStep } from 'vscode-azureextensionui';
import { createRepoFromTemplate } from '../../utils/gitHubUtils';
import { localize } from '../../utils/localize';
import { nonNullProp } from '../../utils/nonNull';
import { IStaticWebAppWizardContext } from '../createStaticWebApp/IStaticWebAppWizardContext';

export class CreateRepoFromTemplateStep extends AzureWizardExecuteStep<IStaticWebAppWizardContext> {
    public priority: number = 100;
    public async execute(wizardContext: IStaticWebAppWizardContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined; }>): Promise<void> {


        const creatingRepository: string = localize('creatingSwa', 'Creating repository from template');
        progress.report({ message: creatingRepository });

        wizardContext.repoCreatedFromTemplate = await createRepoFromTemplate(wizardContext, nonNullProp(wizardContext, 'templateRepo'), nonNullProp(wizardContext, 'newRepoName'));
    }
    public shouldExecute(wizardContext: IStaticWebAppWizardContext): boolean {
        // only execute if a repo hasn't already been created
        return !wizardContext.repoCreatedFromTemplate;
    }
}
