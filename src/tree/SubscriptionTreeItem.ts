/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementClient, WebSiteManagementModels } from '@azure/arm-appservice';
import { AzExtTreeItem, AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, ICreateChildImplContext, LocationListStep, ResourceGroupCreateStep, ResourceGroupListStep, SubscriptionTreeItemBase, VerifyProvidersStep } from 'vscode-azureextensionui';
import { RemoteShortnameStep } from '../commands/createRepo/RemoteShortnameStep';
import { RepoCreateStep } from '../commands/createRepo/RepoCreateStep';
import { RepoNameStep } from '../commands/createRepo/RepoNameStep';
import { RepoPrivacyStep } from '../commands/createRepo/RepoPrivacyStep';
import { addWorkspaceTelemetry } from '../commands/createStaticWebApp/addWorkspaceTelemetry';
import { ApiLocationStep } from '../commands/createStaticWebApp/ApiLocationStep';
import { AppLocationStep } from '../commands/createStaticWebApp/AppLocationStep';
import { BuildPresetListStep } from '../commands/createStaticWebApp/BuildPresetListStep';
import { GitHubOrgListStep } from '../commands/createStaticWebApp/GitHubOrgListStep';
import { GitignoreCreateStep } from '../commands/createStaticWebApp/GitignoreCreateStep';
import { IStaticWebAppWizardContext } from '../commands/createStaticWebApp/IStaticWebAppWizardContext';
import { OutputLocationStep } from '../commands/createStaticWebApp/OutputLocationStep';
import { SkuListStep } from '../commands/createStaticWebApp/SkuListStep';
import { StaticWebAppCreateStep } from '../commands/createStaticWebApp/StaticWebAppCreateStep';
import { StaticWebAppNameStep } from '../commands/createStaticWebApp/StaticWebAppNameStep';
import { apiSubpathSetting, appSubpathSetting, outputSubpathSetting } from '../constants';
import { createWebSiteClient } from '../utils/azureClients';
import { getGitHubAccessToken } from '../utils/gitHubUtils';
import { localize } from '../utils/localize';
import { nonNullProp } from '../utils/nonNull';
import { updateWorkspaceSetting } from '../utils/settingsUtils';
import { getSingleRootFsPath } from '../utils/workspaceUtils';
import { StaticWebAppTreeItem } from './StaticWebAppTreeItem';

export class SubscriptionTreeItem extends SubscriptionTreeItemBase {
    public readonly childTypeLabel: string = localize('staticWebApp', 'Static Web App');
    public supportsAdvancedCreation: boolean = true;

    private readonly _nextLink: string | undefined;

    public hasMoreChildrenImpl(): boolean {
        return !!this._nextLink;
    }

    public async loadMoreChildrenImpl(_clearCache: boolean): Promise<AzExtTreeItem[]> {
        const client: WebSiteManagementClient = await createWebSiteClient(this.root);
        const staticWebApps: WebSiteManagementModels.StaticSitesListResponse = await client.staticSites.list();

        return await this.createTreeItemsWithErrorHandling(
            staticWebApps,
            'invalidStaticWebApp',
            ss => new StaticWebAppTreeItem(this, ss),
            ss => ss.name
        );

    }

    public async createChildImpl(context: ICreateChildImplContext): Promise<AzExtTreeItem> {
        const client: WebSiteManagementClient = await createWebSiteClient(this.root);
        const wizardContext: IStaticWebAppWizardContext = { accessToken: await getGitHubAccessToken(context), client, ...context, ...this.root };
        const title: string = localize('createStaticApp', 'Create Static Web App');
        const promptSteps: AzureWizardPromptStep<IStaticWebAppWizardContext>[] = [];
        const executeSteps: AzureWizardExecuteStep<IStaticWebAppWizardContext>[] = [];

        promptSteps.push(new StaticWebAppNameStep());

        if (!context.advancedCreation) {
            executeSteps.push(new ResourceGroupCreateStep());
        } else {
            promptSteps.push(new ResourceGroupListStep());
        }

        promptSteps.push(new SkuListStep());

        // if the local project doesn't have a GitHub remote, we will create it for them
        if (!wizardContext.originExists) {
            promptSteps.push(new GitHubOrgListStep(), new RepoNameStep(), new RepoPrivacyStep(), new RemoteShortnameStep());
            executeSteps.push(new RepoCreateStep(), new GitignoreCreateStep());
        }

        promptSteps.push(new BuildPresetListStep(), new AppLocationStep(), new ApiLocationStep(), new OutputLocationStep());

        // hard-coding locations available during preview
        // https://github.com/microsoft/vscode-azurestaticwebapps/issues/18
        const locations = [
            { name: 'Central US' },
            { name: 'East US 2' },
            { name: 'East Asia' },
            { name: 'West Europe' },
            { name: 'West US 2' }
        ];
        if (context.advancedCreation) {
            wizardContext.locationsTask = new Promise((resolve) => {
                resolve(locations);
            });
            LocationListStep.addStep(wizardContext, promptSteps);
        } else {
            wizardContext.location = locations[0];
            // default to free for basic
            wizardContext.sku = SkuListStep.getSkus()[0];
        }

        executeSteps.push(new VerifyProvidersStep(['Microsoft.Web']));
        executeSteps.push(new StaticWebAppCreateStep());

        const wizard: AzureWizard<IStaticWebAppWizardContext> = new AzureWizard(wizardContext, {
            title,
            promptSteps,
            executeSteps
        });

        const gotRemote: boolean = !!wizardContext.repoHtmlUrl;
        wizardContext.fsPath = wizardContext.fsPath || getSingleRootFsPath();
        addWorkspaceTelemetry(wizardContext);

        await wizard.prompt();
        const newStaticWebAppName: string = nonNullProp(wizardContext, 'newStaticWebAppName');

        if (!context.advancedCreation) {
            wizardContext.newResourceGroupName = newStaticWebAppName;
        }

        await wizard.execute();
        context.showCreatingTreeItem(newStaticWebAppName);

        if (wizardContext.fsPath && gotRemote) {
            await updateWorkspaceSetting(appSubpathSetting, wizardContext.appLocation, wizardContext.fsPath);
            await updateWorkspaceSetting(apiSubpathSetting, wizardContext.apiLocation, wizardContext.fsPath);
            await updateWorkspaceSetting(outputSubpathSetting, wizardContext.outputLocation, wizardContext.fsPath);
        }

        return new StaticWebAppTreeItem(this, nonNullProp(wizardContext, 'staticWebApp'));
    }
}
