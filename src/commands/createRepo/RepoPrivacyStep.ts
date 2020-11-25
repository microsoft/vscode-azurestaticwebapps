/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IAzureQuickPickItem } from 'vscode-azureextensionui';
import { ext } from '../../extensionVariables';
import { localize } from '../../utils/localize';
import { IStaticWebAppWizardContext } from '../createStaticWebApp/IStaticWebAppWizardContext';

export class RepoPrivacyStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {

    public async prompt(wizardContext: IStaticWebAppWizardContext): Promise<void> {
        const picks: IAzureQuickPickItem<boolean>[] = [
            { label: localize('public', 'Public'), description: localize('publicDesc', 'Anyone on the internet can see this repository. You choose who can commit'), data: false },
            { label: localize('private', 'Private'), description: localize('privateDesc', 'You choose who can see and commit to this repository'), data: true }];
        const placeHolder: string = localize('selectPrivacy', 'Select the privacy of your repository');
        wizardContext.newRepoIsPrivate = (await ext.ui.showQuickPick(picks, { placeHolder })).data;
    }

    public shouldPrompt(wizardContext: IStaticWebAppWizardContext): boolean {
        return wizardContext.newRepoIsPrivate === undefined;
    }
}
