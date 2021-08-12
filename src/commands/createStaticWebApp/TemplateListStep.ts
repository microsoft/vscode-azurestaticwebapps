/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IAzureQuickPickItem } from 'vscode-azureextensionui';
import { RepoData } from '../../gitHubTypings';
import { getTemplateRepos } from '../../utils/gitHubUtils';
import { localize } from '../../utils/localize';
import { nonNullProp } from '../../utils/nonNull';
import { IStaticWebAppWizardContext } from './IStaticWebAppWizardContext';

export class TemplateListStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    public async prompt(context: IStaticWebAppWizardContext): Promise<void> {

        const templateRepos = nonNullProp(context, 'templateRepos');
        const placeHolder: string = localize('chooseTemplatePrompt', 'Choose a template for the new static web app.');

        const getPicks = async () => {
            // Only fetch templates the first time the step is shown
            context.templateRepos = templateRepos.length > 0 ? templateRepos : await getTemplateRepos(context);
            return context.templateRepos.map((repo: RepoData) => ({ label: repo.name, data: repo }));
        }

        const pick: IAzureQuickPickItem<RepoData> = await context.ui.showQuickPick<IAzureQuickPickItem<RepoData>>(getPicks(), { placeHolder, suppressPersistence: true, loadingPlaceHolder: 'Loading templates...' });
        context.templateRepo = pick.data;
    }

    // Only prompt if we're creating from template, and a template hasn't been selected yet.
    public shouldPrompt(context: IStaticWebAppWizardContext): boolean {
        return !!context.fromTemplate && !context.templateRepo;
    }
}
