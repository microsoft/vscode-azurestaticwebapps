/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, DialogResponses, nonNullValueAndProp } from '@microsoft/vscode-azext-utils';
import { localize } from '../../utils/localize';
import { IDeleteWizardContextV2 } from './IDeleteWizardContextv2';

export class ConfirmDeleteStep extends AzureWizardPromptStep<IDeleteWizardContextV2> {
    public async prompt(context: IDeleteWizardContextV2): Promise<void> {
        const confirmMessage: string = localize('deleteConfirmation', 'Are you sure you want to delete static web app "{0}"?', nonNullValueAndProp(context.node, 'name'));
        await context.ui.showWarningMessage(confirmMessage, { modal: true }, DialogResponses.deleteResponse);
    }

    public shouldPrompt(): boolean {
        return true;
    }
}
