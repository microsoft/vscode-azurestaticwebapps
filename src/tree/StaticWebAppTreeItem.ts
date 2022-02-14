/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementClient, WebSiteManagementModels } from "@azure/arm-appservice";
import { GenericResourceExpanded, ResourceManagementClient } from "@azure/arm-resources";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzExtParentTreeItem, AzExtTreeItem, IActionContext, TreeItemIconPath } from "@microsoft/vscode-azext-utils";
import { ProgressLocation, window } from "vscode";
import { onlyGitHubSupported, productionEnvironmentName } from '../constants';
import { ext } from "../extensionVariables";
import { createResourceClient, createWebSiteClient } from "../utils/azureClients";
import { getResourceGroupFromId, pollAzureAsyncOperation } from "../utils/azureUtils";
import { getRepoFullname } from '../utils/gitUtils';
import { localize } from "../utils/localize";
import { nonNullProp } from "../utils/nonNull";
import { openUrl } from '../utils/openUrl';
import { treeUtils } from "../utils/treeUtils";
import { EnvironmentTreeItem } from './EnvironmentTreeItem';
import { IAzureResourceTreeItem } from './IAzureResourceTreeItem';

export class StaticWebAppTreeItem extends AzExtParentTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'azureStaticWebApp';
    public readonly contextValue: string = StaticWebAppTreeItem.contextValue;
    public readonly data: WebSiteManagementModels.StaticSiteARMResource;
    public readonly childTypeLabel: string = localize('environment', 'Environment');

    public name: string;
    public resourceGroup: string;
    public label: string;
    public repositoryUrl: string;
    public branch: string;
    public defaultHostname: string;

    constructor(parent: AzExtParentTreeItem, ss: WebSiteManagementModels.StaticSiteARMResource) {
        super(parent);
        this.data = ss;
        this.name = nonNullProp(this.data, 'name');
        this.id = nonNullProp(this.data, 'id');
        this.resourceGroup = getResourceGroupFromId(this.id);
        this.label = this.name;

        if (this.data.repositoryUrl) {
            this.repositoryUrl = this.data.repositoryUrl;
        } else {
            throw new Error(onlyGitHubSupported);
        }

        this.branch = nonNullProp(this.data, 'branch');
        this.defaultHostname = nonNullProp(this.data, 'defaultHostname');
    }

    public get description(): string | undefined {
        const { owner, name } = getRepoFullname(this.repositoryUrl);
        return `${owner}/${name}`;
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getIconPath('azure-staticwebapps');
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        const client: WebSiteManagementClient = await createWebSiteClient([context, this]);
        const envs: WebSiteManagementModels.StaticSiteBuildCollection = await client.staticSites.getStaticSiteBuilds(this.resourceGroup, this.name);

        return await this.createTreeItemsWithErrorHandling(
            envs,
            'invalidStaticEnvironment',
            async (env: WebSiteManagementModels.StaticSiteBuildARMResource) => {
                return await EnvironmentTreeItem.createEnvironmentTreeItem(context, this, env);
            },
            env => env.buildId
        );
    }

    public compareChildrenImpl(ti1: AzExtTreeItem, ti2: AzExtTreeItem): number {
        // production environment should always be on top
        if (ti1.label === productionEnvironmentName) {
            return -1;
        } else if (ti2.label === productionEnvironmentName) {
            return 1;
        }

        return super.compareChildrenImpl(ti1, ti2);
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async deleteTreeItemImpl(context: IActionContext): Promise<void> {
        const deleting: string = localize('deleting', 'Deleting static web app "{0}"...', this.name);
        await window.withProgress({ location: ProgressLocation.Notification, title: deleting }, async (): Promise<void> => {
            ext.outputChannel.appendLog(deleting);

            const resourceClient: ResourceManagementClient = await createResourceClient([context, this]);
            const resources: GenericResourceExpanded[] = await uiUtils.listAllIterator(resourceClient.resources.listByResourceGroup(this.resourceGroup));

            const client: WebSiteManagementClient = await createWebSiteClient([context, this]);
            // the client API call only awaits the call, but doesn't poll for the result so we handle that ourself
            const deleteResponse = await client.staticSites.deleteStaticSite(this.resourceGroup, this.name);
            await pollAzureAsyncOperation(context, deleteResponse, this.subscription);

            const deleteSucceeded: string = localize('deleteSucceeded', 'Successfully deleted static web app "{0}".', this.name);
            void window.showInformationMessage(deleteSucceeded);
            ext.outputChannel.appendLog(deleteSucceeded);

            if (resources.length === 1) {
                await resourceClient.resourceGroups.beginDeleteAndWait(this.resourceGroup);
            }
        });
    }

    public async browse(): Promise<void> {
        await openUrl(`https://${this.defaultHostname}`);
    }
}
