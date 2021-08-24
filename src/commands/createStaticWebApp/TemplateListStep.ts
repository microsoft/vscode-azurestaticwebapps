/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit } from '@octokit/rest';
import { AzureWizardPromptStep, IActionContext, IAzureQuickPickItem } from 'vscode-azureextensionui';
import { RepoData, RepoResponse } from '../../gitHubTypings';
import { IQuickstartTemplate } from '../../quickstarts/IQuickstartTemplate';
import { quickstartTemplates } from '../../quickstarts/quickstartTemplates';
import { localize } from '../../utils/localize';
import { createOctokitClient } from '../github/createOctokitClient';
import { IStaticWebAppWizardContext } from './IStaticWebAppWizardContext';

export class TemplateListStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    private _templateRepos: RepoData[];
    public async prompt(context: IStaticWebAppWizardContext): Promise<void> {

        const placeHolder: string = localize('chooseTemplatePrompt', 'Choose a quickstart template for the new static web app.');

        const getPicks = async () => {
            this._templateRepos ||= await getTemplateRepos(context);
            return this._templateRepos.map((quickstart: (RepoData & IQuickstartTemplate)) => ({ label: quickstart.displayName, data: quickstart }));
        }

        const pick: IAzureQuickPickItem<RepoData> = await context.ui.showQuickPick<IAzureQuickPickItem<RepoData>>(getPicks(), { placeHolder, suppressPersistence: true, loadingPlaceHolder: 'Loading templates...' });
        context.templateRepo = pick.data;
        await this.setTemplateContexts(context, context.templateRepo.html_url);
    }

    private async setTemplateContexts(context: IStaticWebAppWizardContext, templateUrl: string): Promise<void> {
        const quickstartTemplate = quickstartTemplates.find((quickstart) => quickstart.gitUrl === templateUrl);
        if (quickstartTemplate) {
            context.buildPreset = quickstartTemplate.buildPreset;
            context.outputLocation = quickstartTemplate.buildPreset.outputLocation;
            context.appLocation = quickstartTemplate.buildPreset.appLocation;
            context.apiLocation = quickstartTemplate.buildPreset.apiLocation;
        }
    }

    // Only prompt if we're creating from template, and a template hasn't been selected yet.
    public shouldPrompt(context: IStaticWebAppWizardContext): boolean {
        return !!context.fromTemplate && !context.templateRepo;
    }
}

async function getTemplateRepos(context: IActionContext): Promise<(RepoData & IQuickstartTemplate)[]> {
    const client: Octokit = await createOctokitClient(context);
    const templateReposUsername: string = 'staticwebdev';

    const allRepositories: RepoResponse = await client.repos.listForUser({
        username: templateReposUsername
    });

    const quickstartRepos: (RepoData & IQuickstartTemplate)[] = [];
    quickstartTemplates.forEach((quickstartTemplate) => {
        const repo: RepoData | undefined = allRepositories.data.find((repo) => repo.html_url === quickstartTemplate.gitUrl);
        if (repo) {
            quickstartRepos.push({
                ...repo,
                ...quickstartTemplate
            })
        }
    });
    return quickstartRepos;
}
