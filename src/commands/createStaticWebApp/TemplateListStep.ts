/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit } from '@octokit/rest';
import { AzureWizardPromptStep, IActionContext, IAzureQuickPickItem } from 'vscode-azureextensionui';
import { RepoData, RepoResponse } from '../../gitHubTypings';
import { localize } from '../../utils/localize';
import { createOctokitClient } from '../github/createOctokitClient';
import { IStaticWebAppWizardContext } from './IStaticWebAppWizardContext';

export class TemplateListStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    private _templateRepos: RepoData[];
    public async prompt(context: IStaticWebAppWizardContext): Promise<void> {

        const placeHolder: string = localize('chooseTemplatePrompt', 'Choose a template for the new static web app.');

        const getPicks = async () => {
            this._templateRepos ||= await getTemplateRepos(context);
            return this._templateRepos.map((repo: RepoData) => ({ label: repo.name, data: repo }));
        }

        const pick: IAzureQuickPickItem<RepoData> = await context.ui.showQuickPick<IAzureQuickPickItem<RepoData>>(getPicks(), { placeHolder, suppressPersistence: true, loadingPlaceHolder: 'Loading templates...' });
        context.templateRepo = pick.data;
    }

    // Only prompt if we're creating from template, and a template hasn't been selected yet.
    public shouldPrompt(context: IStaticWebAppWizardContext): boolean {
        return !!context.fromTemplate && !context.templateRepo;
    }
}

async function getTemplateRepos(context: IActionContext): Promise<RepoData[]> {
    const client: Octokit = await createOctokitClient(context);
    const templateReposUsername: string = 'staticwebdev';

    const allRepositories: RepoResponse = await client.repos.listForUser({
        username: templateReposUsername
    });

    return allRepositories.data.filter((repo) => repo.is_template);
}
