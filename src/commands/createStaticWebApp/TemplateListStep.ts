/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit } from '@octokit/rest';
import { AzureWizardPromptStep, IActionContext, IAzureQuickPickItem } from 'vscode-azureextensionui';
import { RepoData, RepoResponse } from '../../gitHubTypings';
import { ISampleTemplate } from '../../samples/ISampleTemplate';
import { quickstartTemplates as sampleTemplates } from '../../samples/sampleTemplates';
import { localize } from '../../utils/localize';
import { createOctokitClient } from '../github/createOctokitClient';
import { IStaticWebAppWizardContext } from './IStaticWebAppWizardContext';
import { StaticWebAppNameStep } from './StaticWebAppNameStep';

export class TemplateListStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    private _templateRepos: RepoData[];
    public async prompt(context: IStaticWebAppWizardContext): Promise<void> {

        const placeHolder: string = localize('chooseSampleTemplatePrompt', 'Choose a sample template to deploy.');

        const getPicks = async () => {
            this._templateRepos ||= await getSampleTemplateRepos(context);
            return this._templateRepos.map((quickstart: (RepoData & ISampleTemplate)) => ({ label: quickstart.displayName, data: quickstart }));
        }

        const pick: IAzureQuickPickItem<RepoData> = await context.ui.showQuickPick<IAzureQuickPickItem<RepoData>>(getPicks(), { placeHolder, suppressPersistence: true, loadingPlaceHolder: 'Loading templates...' });
        context.sampleTemplateRepo = pick.data;
        context.telemetry.properties.quickstartTemplate = context.sampleTemplateRepo.name;
        await this.trySetSwaAndRepoName(context, context.sampleTemplateRepo.name);
        await this.setBuildConfigs(context, context.sampleTemplateRepo.html_url);
    }

    private async trySetSwaAndRepoName(context: IStaticWebAppWizardContext, templateName: string): Promise<void> {
        const swaNameStep = new StaticWebAppNameStep();
        const name = await swaNameStep.getRelatedName(context, templateName);
        if (name) {
            context.newStaticWebAppName = name;
            context.newRepoName = name;
            context.valuesToMask.push(context.newStaticWebAppName);
            context.relatedNameTask = swaNameStep.getRelatedName(context, context.newStaticWebAppName);
        }
    }

    private async setBuildConfigs(context: IStaticWebAppWizardContext, templateUrl: string): Promise<void> {
        const sampleTemplate = sampleTemplates.find((template) => template.gitUrl === templateUrl);
        if (sampleTemplate) {
            context.buildPreset = sampleTemplate.buildPreset;
            context.outputLocation = sampleTemplate.buildPreset.outputLocation;
            context.appLocation = sampleTemplate.buildPreset.appLocation;
            context.apiLocation = sampleTemplate.buildPreset.apiLocation;
        }
    }

    // Only prompt if we're deploying a sample, and a sample template hasn't been selected yet.
    public shouldPrompt(context: IStaticWebAppWizardContext): boolean {
        return !!context.isSample && !context.sampleTemplateRepo;
    }
}

async function getSampleTemplateRepos(context: IActionContext): Promise<(RepoData & ISampleTemplate)[]> {
    const client: Octokit = await createOctokitClient(context);
    const templateReposUsername: string = 'staticwebdev';

    const allRepositories: RepoResponse = await client.repos.listForUser({
        username: templateReposUsername
    });

    const quickstartRepos: (RepoData & ISampleTemplate)[] = [];
    sampleTemplates.forEach((quickstartTemplate) => {
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
