/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ResourceManagementClient, ResourceModels } from 'azure-arm-resource';
import { SiteNameStep } from 'vscode-azureappservice';
import { AzExtTreeItem, AzureWizard, AzureWizardPromptStep, createAzureClient, ICreateChildImplContext, LocationListStep, ResourceGroupListStep, SubscriptionTreeItemBase } from 'vscode-azureextensionui';
import { GitHubBranchListStep } from '../github/GitHubBranchListStep';
import { GitHubOrgListStep } from '../github/GitHubOrgListStep';
import { GitHubRepoListStep } from '../github/GitHubRepoListStep';
import { IStaticSiteWizardContext } from '../github/IStaticSiteWizardContext';
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

        for (const staticSites of allGetRequests) {
            if (staticSites.value.length > 0) {
                return await this.createTreeItemsWithErrorHandling(
                    staticSites.value,
                    'invalidResourceGroup',
                    ss => new StaticSiteTreeItem(this, ss),
                    ss => ss.name
                );
            }
        }

        return [];

    }

    public async createChildImpl(context: ICreateChildImplContext): Promise<AzExtTreeItem> {
        const wizardContext: IStaticSiteWizardContext = { ...context, ...this.root };
        const title: string = localize('connectGitHubRepo', 'Create Static Site');
        const promptSteps: AzureWizardPromptStep<IStaticSiteWizardContext>[] = [new ResourceGroupListStep(), new SiteNameStep(), new GitHubOrgListStep(), new GitHubRepoListStep(), new GitHubBranchListStep()];
        LocationListStep.addStep(wizardContext, promptSteps);

        const wizard: AzureWizard<IStaticSiteWizardContext> = new AzureWizard(wizardContext, {
            title,
            promptSteps
        });

        await wizard.prompt();

        context.showCreatingTreeItem(nonNullProp(wizardContext, 'newSiteName'));
        const requestOptions: requestUtils.Request = await requestUtils.getDefaultAzureRequest(`${nonNullProp(wizardContext, 'resourceGroup').id}/providers/Microsoft.Web/staticSites?api-version=2019-12-01-preview`, this.root);
        requestOptions.location = wizardContext.location;

        const properties: {} = {
            repositoryUrl: wizardContext.repoData?.html_url,
            branch: wizardContext.branchData?.name,
            repositoryToken: wizardContext.accessToken
        };
        requestOptions.properties = properties;

        const standard: string = 'Standard';
        requestOptions.sku = { Name: standard, Tier: standard };

        const staticSite: StaticSite = <StaticSite>JSON.parse(await requestUtils.sendRequest(requestOptions));
        return new StaticSiteTreeItem(this, staticSite);
    }
}
