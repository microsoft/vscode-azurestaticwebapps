/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementClient, WebSiteManagementModels } from '@azure/arm-appservice';
import { ReposGetResponseData } from '@octokit/types';
import { AzExtTreeItem, AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, ICreateChildImplContext, LocationListStep, ResourceGroupCreateStep, ResourceGroupListStep, SubscriptionTreeItemBase, VerifyProvidersStep } from 'vscode-azureextensionui';
import { RemoteShortnameStep } from '../commands/createRepo/RemoteShortnameStep';
import { RepoCreateStep } from '../commands/createRepo/RepoCreateStep';
import { RepoNameStep } from '../commands/createRepo/RepoNameStep';
import { RepoPrivacyStep } from '../commands/createRepo/RepoPrivacyStep';
import { WorkspaceListStep } from '../commands/createRepo/WorkspaceListStep';
import { addWorkspaceTelemetry } from '../commands/createStaticWebApp/addWorkspaceTelemetry';
import { ApiLocationStep } from '../commands/createStaticWebApp/ApiLocationStep';
import { AppLocationStep } from '../commands/createStaticWebApp/AppLocationStep';
import { BuildPresetListStep } from '../commands/createStaticWebApp/BuildPresetListStep';
import { GitHubOrgListStep } from '../commands/createStaticWebApp/GitHubOrgListStep';
import { GitignoreCreateStep } from '../commands/createStaticWebApp/GitignoreCreateStep';
import { IStaticWebAppWizardContext } from '../commands/createStaticWebApp/IStaticWebAppWizardContext';
import { OutputLocationStep } from '../commands/createStaticWebApp/OutputLocationStep';
import { StaticWebAppCreateStep } from '../commands/createStaticWebApp/StaticWebAppCreateStep';
import { StaticWebAppNameStep } from '../commands/createStaticWebApp/StaticWebAppNameStep';
import { apiSubpathSetting, appSubpathSetting, outputSubpathSetting } from '../constants';
import { createWebSiteClient } from '../utils/azureClients';
import { getGitHubAccessToken, tryGetProjectForCreation } from '../utils/gitHubUtils';
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

        // because a workspace is a requirement, we can be confident that there is a fsPath
        await WorkspaceListStep.setWorkspaceContexts(wizardContext, nonNullProp(wizardContext, 'fsPath'));

        // if the local project doesn't have a GitHub remote, we will create it for them
        if (!wizardContext.originExists) {
            promptSteps.push(new GitHubOrgListStep(), new RepoNameStep(), new RepoPrivacyStep(), new RemoteShortnameStep());
            executeSteps.push(new RepoCreateStep(), new GitignoreCreateStep());
        }

        promptSteps.push(new StaticWebAppNameStep());
        if (context.advancedCreation) {
            promptSteps.push(new ResourceGroupListStep());
        } else {
            const remoteRepo: ReposGetResponseData | undefined = await tryGetProjectForCreation(context, wizardContext.fsPath);
            if (remoteRepo) {
                wizardContext.repoHtmlUrl = remoteRepo.html_url;
                wizardContext.branchData = { name: remoteRepo.default_branch };
            }
            executeSteps.push(new ResourceGroupCreateStep());
        }
        promptSteps.push(new BuildPresetListStep(), new AppLocationStep(), new ApiLocationStep(), new OutputLocationStep());

        executeSteps.push(new VerifyProvidersStep(['Microsoft.Web']));
        executeSteps.push(new StaticWebAppCreateStep());

        // hard-coding locations available during preview
        // https://github.com/microsoft/vscode-azurestaticwebapps/issues/18
        wizardContext.locationsTask = new Promise((resolve) => {
            resolve([
                { name: 'Central US' },
                { name: 'East US 2' },
                { name: 'East Asia' },
                { name: 'West Europe' },
                { name: 'West US 2' }
            ]);
        });

        LocationListStep.addStep(wizardContext, promptSteps);
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
