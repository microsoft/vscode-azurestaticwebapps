/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IActionContext } from 'vscode-azureextensionui';
import { localize } from '../../utils/localize';
import { nonNullValueAndProp } from '../../utils/nonNull';
import { GitHubOrgListStep } from '../createStaticWebApp/GitHubOrgListStep';
import { IStaticWebAppWizardContext } from '../createStaticWebApp/IStaticWebAppWizardContext';
import { RepoNameStep } from './RepoNameStep';

export class TemplateRepoNameStep extends AzureWizardPromptStep<Partial<IStaticWebAppWizardContext> & IActionContext> {
    public async prompt(context: Partial<IStaticWebAppWizardContext> & IActionContext): Promise<void> {
        const templateName = nonNullValueAndProp(context.templateRepo, 'name');

        const validateNameContext: Partial<IStaticWebAppWizardContext> & IActionContext = {
            ...context,
            orgData: await GitHubOrgListStep.getAuthenticatedUser(context)
        }

        const validateRepoName = async (value: string): Promise<string | undefined> => await RepoNameStep.validateRepoName(validateNameContext, value);
        const isTemplateNameAValidRepoName = !(await validateRepoName(templateName));
        context.newRepoName = await context.ui.showInputBox({
            validateInput: validateRepoName,
            prompt: localize('newRepoFromTemplatePrompt', 'Enter the name of the new GitHub repository to create from the "{0}" template.', templateName),
            value: isTemplateNameAValidRepoName ? templateName : ''
        });

        context.valuesToMask.push(context.newRepoName);
    }

    public shouldPrompt(context: Partial<IStaticWebAppWizardContext> & IActionContext): boolean {
        // must have picked a template and not have a name
        return !!context.templateRepo && !context.newRepoName;
    }
}
