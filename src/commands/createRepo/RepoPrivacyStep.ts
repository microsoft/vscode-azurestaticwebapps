/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IAzureQuickPickItem } from '@microsoft/vscode-azext-utils';
import { localize } from '../../utils/localize';
import { IStaticWebAppWizardContext } from '../createStaticWebApp/IStaticWebAppWizardContext';

export class RepoPrivacyStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {

    public async prompt(context: IStaticWebAppWizardContext): Promise<void> {
        const picks: IAzureQuickPickItem<boolean>[] = [
            { label: localize('public', 'Public'), description: localize('publicDesc', 'Anyone on the internet can see this repository. You choose who can commit'), data: false },
            { label: localize('private', 'Private'), description: localize('privateDesc', 'You choose who can see and commit to this repository'), data: true }];
        const placeHolder: string = localize('selectPrivacy', 'Select the privacy of your repository');
        context.newRepoIsPrivate = (await context.ui.showQuickPick(picks, { placeHolder })).data;
    }

    public shouldPrompt(context: IStaticWebAppWizardContext): boolean {
        return context.newRepoIsPrivate === undefined;
    }
}
