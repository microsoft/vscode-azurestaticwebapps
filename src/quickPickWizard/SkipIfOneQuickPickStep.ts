/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ResourceModelBase } from '../v2AzureResourcesApi';
import { QuickPickWizardContext } from './QuickPickWizardContext';
import { RecursiveQuickPickStep } from './RecursiveQuickPickStep';

export class SkipIfOneQuickPickStep<TModel extends ResourceModelBase> extends RecursiveQuickPickStep<TModel> {
    protected async promptInternal(wizardContext: QuickPickWizardContext<TModel>): Promise<TModel> {
        // Overrides `promptInternal` to skip the prompt if only one choice exists
        const picks = await this.getPicks(wizardContext);

        if (picks.length === 1) {
            return picks[0].data;
        } else {
            const selected = await wizardContext.ui.showQuickPick(picks, { /* TODO: options */ });
            return selected.data;
        }
    }
}
