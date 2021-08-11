/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IAzureQuickPickItem } from 'vscode-azureextensionui';
import { RepoData } from '../../gitHubTypings';
import { getTemplateRepos } from '../../utils/gitHubUtils';
import { localize } from '../../utils/localize';
import { IStaticWebAppWizardContext } from './IStaticWebAppWizardContext';

export class TemplateListStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    public async prompt(context: IStaticWebAppWizardContext): Promise<void> {

        const placeHolder: string = localize('chooseTemplatePrompt', 'Choose a template for the new static web app.');

        const getPicks = async () => {
            const templateReps: RepoData[] = await getTemplateRepos(context);
            return templateReps.map((repo: RepoData) => ({ label: repo.name, data: repo }));
        }

        const pick: IAzureQuickPickItem<RepoData> = await context.ui.showQuickPick<IAzureQuickPickItem<RepoData>>(getPicks(), { placeHolder, suppressPersistence: true, loadingPlaceHolder: 'Loading templates...' });
        context.templateRepo = pick.data;
    }

    // Only prompt if we're creating from template, and a template hasn't been selected yet.
    public shouldPrompt(context: IStaticWebAppWizardContext): boolean {
        return !!context.fromTemplate && !context.templateRepo;
    }
}
