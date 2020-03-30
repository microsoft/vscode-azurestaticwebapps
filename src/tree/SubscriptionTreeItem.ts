/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ResourceManagementClient, ResourceModels } from 'azure-arm-resource';
import { SiteNameStep } from 'vscode-azureappservice';
import { AzExtTreeItem, AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, createAzureClient, ICreateChildImplContext, LocationListStep, ResourceGroupCreateStep, ResourceGroupListStep, SubscriptionTreeItemBase } from 'vscode-azureextensionui';
import { ApiLocationStep } from '../commands/createStaticWebApp/ApiLocationStep';
import { AppArtifactLocationStep } from '../commands/createStaticWebApp/AppArtifactLocationStep';
import { AppLocationStep } from '../commands/createStaticWebApp/AppLocationStep';
import { IStaticSiteWizardContext } from '../commands/createStaticWebApp/IStaticSiteWizardContext';
import { GitHubBranchListStep } from '../github/GitHubBranchListStep';
import { GitHubOrgListStep } from '../github/GitHubOrgListStep';
import { GitHubRepoListStep } from '../github/GitHubRepoListStep';
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
        const promptSteps: AzureWizardPromptStep<IStaticSiteWizardContext>[] = [new SiteNameStep(), new ResourceGroupListStep(), new GitHubOrgListStep(), new GitHubRepoListStep(), new GitHubBranchListStep(), new AppLocationStep(), new ApiLocationStep(), new AppArtifactLocationStep()];
        LocationListStep.addStep(wizardContext, promptSteps);
        const executeSteps: AzureWizardExecuteStep<IStaticSiteWizardContext>[] = [new ResourceGroupCreateStep()];

        const wizard: AzureWizard<IStaticSiteWizardContext> = new AzureWizard(wizardContext, {
            title,
            promptSteps,
            executeSteps
        });

        await wizard.prompt();
        await wizard.execute();

        const newSiteName: string = nonNullProp(wizardContext, 'newSiteName');
        context.showCreatingTreeItem(newSiteName);
        const requestOptions: requestUtils.Request = await requestUtils.getDefaultAzureRequest(`${nonNullProp(wizardContext, 'resourceGroup').id}/providers/Microsoft.Web/staticSites/${newSiteName}?api-version=2019-12-01-preview`, this.root, 'PUT');
        requestOptions.headers['Content-Type'] = 'application/json';
        // tslint:disable-next-line:no-any
        const requestBody: any = {};
        requestBody.location = wizardContext.location?.name;

        const properties: {} = {
            repositoryUrl: wizardContext.repoData?.html_url,
            branch: wizardContext.branchData?.name,
            repositoryToken: wizardContext.accessToken,
            buildProperties: {
                appLocation: wizardContext.appLocation,
                apiLocation: wizardContext.apiLocation,
                appArtifactLocation: wizardContext.appArtifactLocation
            }
        };
        requestBody.properties = properties;

        const standard: string = 'Standard';
        requestBody.sku = { Name: standard, Tier: standard };

        requestOptions.body = JSON.stringify(requestBody);

        const staticSite: StaticSite = <StaticSite>JSON.parse(await requestUtils.sendRequest(requestOptions));
        return new StaticSiteTreeItem(this, staticSite);
    }
}
