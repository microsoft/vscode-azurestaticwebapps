/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtTreeItem, AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, ICreateChildImplContext, LocationListStep, ResourceGroupCreateStep, SubscriptionTreeItemBase, VerifyProvidersStep } from 'vscode-azureextensionui';
import { addWorkspaceTelemetry } from '../commands/createStaticWebApp/addWorkspaceTelemetry';
import { ApiLocationStep } from '../commands/createStaticWebApp/ApiLocationStep';
import { AppArtifactLocationStep } from '../commands/createStaticWebApp/AppArtifactLocationStep';
import { AppLocationStep } from '../commands/createStaticWebApp/AppLocationStep';
import { GitHubBranchListStep } from '../commands/createStaticWebApp/GitHubBranchListStep';
import { GitHubOrgListStep } from '../commands/createStaticWebApp/GitHubOrgListStep';
import { GitHubRepoListStep } from '../commands/createStaticWebApp/GitHubRepoListStep';
import { IStaticWebAppWizardContext } from '../commands/createStaticWebApp/IStaticWebAppWizardContext';
import { StaticWebAppCreateStep } from '../commands/createStaticWebApp/StaticWebAppCreateStep';
import { StaticWebAppNameStep } from '../commands/createStaticWebApp/StaticWebAppNameStep';
import { apiSubpathSetting, appArtifactSubpathSetting, appSubpathSetting } from '../constants';
import { getGitHubAccessToken, tryGetRemote } from '../utils/gitHubUtils';
import { localize } from '../utils/localize';
import { nonNullProp } from '../utils/nonNull';
import { requestUtils } from '../utils/requestUtils';
import { updateWorkspaceSetting } from '../utils/settingsUtils';
import { getSingleRootFsPath } from '../utils/workspaceUtils';
import { StaticWebApp, StaticWebAppTreeItem } from './StaticWebAppTreeItem';

export class SubscriptionTreeItem extends SubscriptionTreeItemBase {
    public readonly childTypeLabel: string = localize('staticWebApp', 'Static Web App');

    private readonly _nextLink: string | undefined;

    public hasMoreChildrenImpl(): boolean {
        return !!this._nextLink;
    }

    public async loadMoreChildrenImpl(_clearCache: boolean): Promise<AzExtTreeItem[]> {
        const requestOptions: requestUtils.Request = await requestUtils.getDefaultAzureRequest(`subscriptions/${this.root.subscriptionId}/providers/Microsoft.Web/staticSites?api-version=2019-12-01-preview`, this.root);
        const staticWebApps: StaticWebApp[] = (<{ value: StaticWebApp[] }>JSON.parse(await requestUtils.sendRequest(requestOptions))).value;

        return await this.createTreeItemsWithErrorHandling(
            staticWebApps,
            'invalidStaticWebApp',
            ss => new StaticWebAppTreeItem(this, ss),
            ss => ss.name
        );

    }

    public async createChildImpl(context: ICreateChildImplContext): Promise<AzExtTreeItem> {
        const wizardContext: IStaticWebAppWizardContext = { accessToken: await getGitHubAccessToken(), ...context, ...this.root };
        const title: string = localize('createStaticApp', 'Create Static Web App');
        const promptSteps: AzureWizardPromptStep<IStaticWebAppWizardContext>[] = [new StaticWebAppNameStep(), new GitHubOrgListStep(), new GitHubRepoListStep(), new GitHubBranchListStep(), new AppLocationStep(), new ApiLocationStep(), new AppArtifactLocationStep()];

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

        const executeSteps: AzureWizardExecuteStep<IStaticWebAppWizardContext>[] = [
            new ResourceGroupCreateStep(),
            new VerifyProvidersStep(['Microsoft.Web']),
            new StaticWebAppCreateStep()];

        const wizard: AzureWizard<IStaticWebAppWizardContext> = new AzureWizard(wizardContext, {
            title,
            promptSteps,
            executeSteps
        });

        wizardContext.accessToken = await getGitHubAccessToken();
        wizardContext.repoHtmlUrl = await tryGetRemote();
        const gotRemote: boolean = !!wizardContext.repoHtmlUrl;

        wizardContext.fsPath = getSingleRootFsPath();
        addWorkspaceTelemetry(wizardContext);

        await wizard.prompt();
        const newStaticWebAppName: string = nonNullProp(wizardContext, 'newStaticWebAppName');
        wizardContext.newResourceGroupName = newStaticWebAppName;

        await wizard.execute();
        context.showCreatingTreeItem(newStaticWebAppName);

        if (wizardContext.fsPath && gotRemote) {
            await updateWorkspaceSetting(appSubpathSetting, wizardContext.appLocation, wizardContext.fsPath);
            await updateWorkspaceSetting(apiSubpathSetting, wizardContext.apiLocation, wizardContext.fsPath);
            await updateWorkspaceSetting(appArtifactSubpathSetting, wizardContext.appArtifactLocation, wizardContext.fsPath);
        }

        return new StaticWebAppTreeItem(this, nonNullProp(wizardContext, 'staticWebApp'));
    }
}
