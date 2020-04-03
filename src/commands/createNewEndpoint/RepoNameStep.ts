/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from 'vscode-azureextensionui';
import { ext } from '../../extensionVariables';
import { localize } from '../../utils/localize';
import { INewEndpointWizardContext } from './INewEndpointWizardContext';

export class RepoNameStep extends AzureWizardPromptStep<INewEndpointWizardContext> {
    public async prompt(wizardContext: INewEndpointWizardContext): Promise<void> {
        wizardContext.newRepoName = (await ext.ui.showInputBox({
            prompt: localize('AppServicePlanPrompt', 'Enter the name of the new GitHub repository.'),
            validateInput: async (value: string): Promise<string | undefined> => await this.validatePlanName(value)
        })).trim();
    }

    public shouldPrompt(wizardContext: INewEndpointWizardContext): boolean {
        return !wizardContext.newRepoName;
    }

    private async validatePlanName(name: string | undefined): Promise<string | undefined> {
        name = name ? name.trim() : '';

        if (name === '.' || name === '..') {
            return localize('reserved', 'The repository "{0}" is reserved.', name);
        } else if (name.length < 1) {
            return localize('invalidLength', 'The name must be between at least 1 character.');
        } else {
            return undefined;
        }
    }
}
