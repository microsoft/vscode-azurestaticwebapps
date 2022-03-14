/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { StaticSiteARMResource, WebSiteManagementClient } from '@azure/arm-appservice';
import { LocationListStep, ResourceGroupCreateStep, ResourceGroupListStep, SubscriptionTreeItemBase, uiUtils, VerifyProvidersStep } from '@microsoft/vscode-azext-azureutils';
import { AzExtTreeItem, AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, IActionContext, ICreateChildImplContext, parseError } from '@microsoft/vscode-azext-utils';
import { workspace } from 'vscode';
import { RemoteShortnameStep } from '../commands/createRepo/RemoteShortnameStep';
import { RepoCreateStep } from '../commands/createRepo/RepoCreateStep';
import { RepoNameStep } from '../commands/createRepo/RepoNameStep';
import { RepoPrivacyStep } from '../commands/createRepo/RepoPrivacyStep';
import { ApiLocationStep } from '../commands/createStaticWebApp/ApiLocationStep';
import { AppLocationStep } from '../commands/createStaticWebApp/AppLocationStep';
import { BuildPresetListStep } from '../commands/createStaticWebApp/BuildPresetListStep';
import { GitHubOrgListStep } from '../commands/createStaticWebApp/GitHubOrgListStep';
import { IStaticWebAppWizardContext } from '../commands/createStaticWebApp/IStaticWebAppWizardContext';
import { OutputLocationStep } from '../commands/createStaticWebApp/OutputLocationStep';
import { SkuListStep } from '../commands/createStaticWebApp/SkuListStep';
import { StaticWebAppCreateStep } from '../commands/createStaticWebApp/StaticWebAppCreateStep';
import { StaticWebAppNameStep } from '../commands/createStaticWebApp/StaticWebAppNameStep';
import { createWebSiteClient } from '../utils/azureClients';
import { getGitHubAccessToken } from '../utils/gitHubUtils';
import { gitPull } from '../utils/gitUtils';
import { localize } from '../utils/localize';
import { nonNullProp } from '../utils/nonNull';
import { getSingleRootFsPath } from '../utils/workspaceUtils';
import { StaticWebAppTreeItem } from './StaticWebAppTreeItem';

export class SubscriptionTreeItem extends SubscriptionTreeItemBase {
    public readonly childTypeLabel: string = localize('staticWebApp', 'Static Web App');
    public supportsAdvancedCreation: boolean = true;

    private readonly _nextLink: string | undefined;

    public hasMoreChildrenImpl(): boolean {
        return !!this._nextLink;
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        const client: WebSiteManagementClient = await createWebSiteClient([context, this]);
        let staticWebApps: StaticSiteARMResource[] = []

        try {
            staticWebApps = await uiUtils.listAllIterator(client.staticSites.list());
        } catch (e) {
            if (/InvalidResourceType/i.test(parseError(e).errorType)) {
                throw new Error(localize('staticWebAppsNotSupported', 'Static Web Apps are not supported in {0}.', this.subscription.environment.name));
            }
        }

        return await this.createTreeItemsWithErrorHandling(
            staticWebApps,
            'invalidStaticWebApp',
            ss => new StaticWebAppTreeItem(this, ss),
            ss => ss.name
        );
    }

    public async createChildImpl(context: ICreateChildImplContext): Promise<AzExtTreeItem> {
        const client: WebSiteManagementClient = await createWebSiteClient([context, this]);
        const wizardContext: IStaticWebAppWizardContext = { accessToken: await getGitHubAccessToken(), client, ...context, ...this.subscription };

        const title: string = localize('createStaticApp', 'Create Static Web App');
        const promptSteps: AzureWizardPromptStep<IStaticWebAppWizardContext>[] = [];
        const executeSteps: AzureWizardExecuteStep<IStaticWebAppWizardContext>[] = [];

        if (!context.advancedCreation) {
            wizardContext.sku = SkuListStep.getSkus()[0];
            executeSteps.push(new ResourceGroupCreateStep());
        } else {
            promptSteps.push(new ResourceGroupListStep());
        }

        promptSteps.push(new StaticWebAppNameStep(), new SkuListStep());
        const hasRemote: boolean = !!wizardContext.repoHtmlUrl;

        // if the local project doesn't have a GitHub remote, we will create it for them
        if (!hasRemote) {
            promptSteps.push(new GitHubOrgListStep(), new RepoNameStep(), new RepoPrivacyStep(), new RemoteShortnameStep());
            executeSteps.push(new RepoCreateStep());
        }

        // hard-coding locations available during preview
        // https://github.com/microsoft/vscode-azurestaticwebapps/issues/18
        const locations = [
            'Central US',
            'East US 2',
            'East Asia',
            'West Europe',
            'West US 2'
        ];

        const webProvider: string = 'Microsoft.Web';

        LocationListStep.setLocationSubset(wizardContext, Promise.resolve(locations), webProvider);
        LocationListStep.addStep(wizardContext, promptSteps, {
            placeHolder: localize('selectLocation', 'Select a region for Azure Functions API and staging environments'),
            noPicksMessage: localize('noRegions', 'No available regions.')
        });

        promptSteps.push(new BuildPresetListStep(), new AppLocationStep(), new ApiLocationStep(), new OutputLocationStep());

        executeSteps.push(new VerifyProvidersStep([webProvider]));
        executeSteps.push(new StaticWebAppCreateStep());

        const wizard: AzureWizard<IStaticWebAppWizardContext> = new AzureWizard(wizardContext, {
            title,
            promptSteps,
            executeSteps,
            showLoadingPrompt: true
        });

        wizardContext.telemetry.properties.gotRemote = String(hasRemote);
        wizardContext.fsPath = wizardContext.fsPath || getSingleRootFsPath();
        wizardContext.telemetry.properties.numberOfWorkspaces = !workspace.workspaceFolders ? String(0) : String(workspace.workspaceFolders.length);

        await wizard.prompt();

        const newStaticWebAppName: string = nonNullProp(wizardContext, 'newStaticWebAppName');

        if (!context.advancedCreation) {
            wizardContext.newResourceGroupName = await wizardContext.relatedNameTask;
        }

        await wizard.execute();
        context.showCreatingTreeItem(newStaticWebAppName);

        await gitPull(nonNullProp(wizardContext, 'repo'));
        return new StaticWebAppTreeItem(this, nonNullProp(wizardContext, 'staticWebApp'));
    }
}
