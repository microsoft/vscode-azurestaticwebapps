/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IActionContext, IAzureQuickPickItem } from 'vscode-azureextensionui';
import { RepoData } from '../../gitHubTypings';
import { localize } from '../../utils/localize';
import { getTemplateReposFromGitHub } from '../../utils/templateUtils';
import { IStaticWebAppWizardContext } from '../createStaticWebApp/IStaticWebAppWizardContext';

export class PickTemplateStep extends AzureWizardPromptStep<Partial<IStaticWebAppWizardContext> & IActionContext> {
    public async prompt(context: Partial<IStaticWebAppWizardContext> & IActionContext): Promise<void> {
        const templateRepos: RepoData[] = await getTemplateReposFromGitHub(context);

        const placeHolder: string = localize('chooseTemplatePrompt', 'Choose a static web app template for the new repository.');
        const picks: IAzureQuickPickItem<RepoData>[] = templateRepos.map((repo) => { return { label: repo.name, data: repo }; });
        const pick: IAzureQuickPickItem<RepoData> = await context.ui.showQuickPick(picks, { placeHolder, suppressPersistence: true });

        context.templateRepo = pick.data;
    }

    public shouldPrompt(context: Partial<IStaticWebAppWizardContext> & IActionContext): boolean {
        return !context.templateRepo;
    }
}
