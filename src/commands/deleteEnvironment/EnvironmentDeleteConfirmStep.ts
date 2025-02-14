/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, DialogResponses } from '@microsoft/vscode-azext-utils';
import { localize } from '../../utils/localize';
import { EnvironmentDeleteContext } from './EnvironmentDeleteContext';

export class EnvironmentDeleteConfirmStep extends AzureWizardPromptStep<EnvironmentDeleteContext> {
    public async prompt(context: EnvironmentDeleteContext): Promise<void> {
        const confirmMessage: string = localize('deleteConfirmation', 'Are you sure you want to delete environment "{0}"?', context.environmentName);
        await context.ui.showWarningMessage(confirmMessage, { modal: true }, DialogResponses.deleteResponse);
    }

    public shouldPrompt(): boolean {
        return true;
    }
}
