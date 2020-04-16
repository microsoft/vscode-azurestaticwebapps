/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ResourceManagementClient, ResourceModels } from 'azure-arm-resource';
import { SiteNameStep } from 'vscode-azureappservice';
import { AzExtTreeItem, AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, createAzureClient, ICreateChildImplContext, LocationListStep, ResourceGroupCreateStep, SubscriptionTreeItemBase } from 'vscode-azureextensionui';
import { ApiLocationStep } from '../commands/createStaticWebApp/ApiLocationStep';
import { AppArtifactLocationStep } from '../commands/createStaticWebApp/AppArtifactLocationStep';
import { AppLocationStep } from '../commands/createStaticWebApp/AppLocationStep';
import { IStaticSiteWizardContext } from '../commands/createStaticWebApp/IStaticSiteWizardContext';
import { StaticWebAppCreateStep } from '../commands/createStaticWebApp/StaticWebAppCreateStep';
import { GitHubBranchListStep } from '../github/GitHubBranchListStep';
import { GitHubOrgListStep } from '../github/GitHubOrgListStep';
import { GitHubRepoListStep } from '../github/GitHubRepoListStep';
import { IGitHubAccessTokenContext } from '../IGitHubAccessTokenContext';
import { localize } from '../utils/localize';
import { nonNullProp } from '../utils/nonNull';
import { requestUtils } from '../utils/requestUtils';
import { StaticSite, StaticSiteTreeItem } from './StaticSiteTreeItem';

export class SubscriptionTreeItem extends SubscriptionTreeItemBase {
    public readonly childTypeLabel: string = localize('resourceGroup', 'Resource Group');

    private _nextLink: string | undefined;

    public hasMoreChildrenImpl(): boolean {
        return !!this._nextLink;
    }

    public async loadMoreChildrenImpl(clearCache: boolean): Promise<AzExtTreeItem[]> {
        if (clearCache) {
            this._nextLink = undefined;
        }

        const client: ResourceManagementClient = createAzureClient(this.root, ResourceManagementClient);
        const rgs: ResourceModels.ResourceGroupListResult = this._nextLink ? await client.resourceGroups.listNext(this._nextLink) : await client.resourceGroups.list();
        this._nextLink = rgs.nextLink;
        const allGetRequests: { value: StaticSite[] }[] = await Promise.all(rgs.map(async (rg) => {
            const requestOptions: requestUtils.Request = await requestUtils.getDefaultAzureRequest(`${rg.id}/providers/Microsoft.Web/staticSites?api-version=2019-12-01-preview`, this.root);
            return JSON.parse(await requestUtils.sendRequest(requestOptions));
        }));

        const staticSites: StaticSite[] = [];

        for (const ssRes of allGetRequests) {
            if (ssRes.value.length > 0) {
                for (const ss of ssRes.value) {
                    staticSites.push(ss);
                }
            }
        }

        return await this.createTreeItemsWithErrorHandling(
            staticSites,
            'invalidResourceGroup',
            ss => new StaticSiteTreeItem(this, ss),
            ss => ss.name
        );

    }

    public async createChildImpl(context: ICreateChildImplContext): Promise<AzExtTreeItem> {
        const wizardContext: IStaticSiteWizardContext = { ...context, ...this.root };
        const title: string = localize('createStaticApp', 'Create Static Web App');
        const promptSteps: AzureWizardPromptStep<IGitHubAccessTokenContext>[] = [new SiteNameStep(), new GitHubOrgListStep(), new GitHubRepoListStep(), new GitHubBranchListStep(), new AppLocationStep(), new ApiLocationStep(), new AppArtifactLocationStep()];
        LocationListStep.addStep(wizardContext, promptSteps);
        const executeSteps: AzureWizardExecuteStep<IStaticSiteWizardContext>[] = [new ResourceGroupCreateStep(), new StaticWebAppCreateStep()];

        const wizard: AzureWizard<IStaticSiteWizardContext> = new AzureWizard(wizardContext, {
            title,
            promptSteps,
            executeSteps
        });

        await wizard.prompt();
        const newName: string | undefined = await wizardContext.relatedNameTask;
        if (!newName) {
            throw new Error(localize('noUniqueName', 'Failed to generate unique name for resources. Use advanced creation to manually enter resource names.'));
        }
        wizardContext.newResourceGroupName = newName;

        await wizard.execute();
        const newSiteName: string = nonNullProp(wizardContext, 'newSiteName');
        context.showCreatingTreeItem(newSiteName);

        return new StaticSiteTreeItem(this, nonNullProp(wizardContext, 'site'));
    }
}
