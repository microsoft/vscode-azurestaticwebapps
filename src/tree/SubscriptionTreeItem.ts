/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtTreeItem, AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, ICreateChildImplContext, LocationListStep, ResourceGroupCreateStep, SubscriptionTreeItemBase } from 'vscode-azureextensionui';
import { ApiLocationStep } from '../commands/createStaticWebApp/ApiLocationStep';
import { AppArtifactLocationStep } from '../commands/createStaticWebApp/AppArtifactLocationStep';
import { AppLocationStep } from '../commands/createStaticWebApp/AppLocationStep';
import { IStaticWebAppWizardContext } from '../commands/createStaticWebApp/IStaticWebAppWizardContext';
import { StaticWebAppCreateStep } from '../commands/createStaticWebApp/StaticWebAppCreateStep';
import { StaticWebAppNameStep } from '../commands/createStaticWebApp/StaticWebAppNameStep';
import { GitHubBranchListStep } from '../github/GitHubBranchListStep';
import { GitHubOrgListStep } from '../github/GitHubOrgListStep';
import { GitHubRepoListStep } from '../github/GitHubRepoListStep';
import { IGitHubAccessTokenContext } from '../IGitHubAccessTokenContext';
import { getGitHubAccessToken } from '../utils/gitHubUtils';
import { localize } from '../utils/localize';
import { nonNullProp } from '../utils/nonNull';
import { requestUtils } from '../utils/requestUtils';
import { StaticWebApp, StaticWebAppTreeItem } from './StaticWebAppTreeItem';

export class SubscriptionTreeItem extends SubscriptionTreeItemBase {
    public readonly childTypeLabel: string = localize('resourceGroup', 'Resource Group');

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
        const wizardContext: IStaticWebAppWizardContext = { ...context, ...this.root };
        const title: string = localize('createStaticApp', 'Create Static Web App');
        const promptSteps: AzureWizardPromptStep<IGitHubAccessTokenContext>[] = [new StaticWebAppNameStep(), new GitHubOrgListStep(), new GitHubRepoListStep(), new GitHubBranchListStep(), new AppLocationStep(), new ApiLocationStep(), new AppArtifactLocationStep()];

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

        const executeSteps: AzureWizardExecuteStep<IStaticWebAppWizardContext>[] = [new ResourceGroupCreateStep(), new StaticWebAppCreateStep()];

        const wizard: AzureWizard<IStaticWebAppWizardContext> = new AzureWizard(wizardContext, {
            title,
            promptSteps,
            executeSteps
        });

        wizardContext.accessToken = await getGitHubAccessToken();

        await wizard.prompt();
        const newStaticWebAppName: string = nonNullProp(wizardContext, 'newStaticWebAppName');
        wizardContext.newResourceGroupName = newStaticWebAppName;

        await wizard.execute();
        context.showCreatingTreeItem(newStaticWebAppName);

        return new StaticWebAppTreeItem(this, nonNullProp(wizardContext, 'staticWebApp'));
    }
}
