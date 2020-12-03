/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementClient, WebSiteManagementModels } from "@azure/arm-appservice";
import { ProgressLocation, window } from "vscode";
import { AzExtTreeItem, AzureParentTreeItem, IActionContext, TreeItemIconPath } from "vscode-azureextensionui";
import { productionEnvironmentName } from '../constants';
import { ext } from "../extensionVariables";
import { createWebSiteClient } from "../utils/azureClients";
import { getResourceGroupFromId, pollAzureAsyncOperation } from "../utils/azureUtils";
import { getRepoFullname } from '../utils/gitHubUtils';
import { localize } from "../utils/localize";
import { nonNullProp } from "../utils/nonNull";
import { openUrl } from '../utils/openUrl';
import { treeUtils } from "../utils/treeUtils";
import { EnvironmentTreeItem } from './EnvironmentTreeItem';
import { IAzureResourceTreeItem } from './IAzureResourceTreeItem';

export class StaticWebAppTreeItem extends AzureParentTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'azureStaticWebApp';
    public readonly contextValue: string = StaticWebAppTreeItem.contextValue;
    public readonly data: WebSiteManagementModels.StaticSiteARMResource;
    public readonly childTypeLabel: string = localize('environment', 'Environment');

    public name: string;
    public id: string;
    public resourceGroup: string;
    public label: string;
    public repositoryUrl: string;
    public branch: string;
    public defaultHostname: string;

    constructor(parent: AzureParentTreeItem, ss: WebSiteManagementModels.StaticSiteARMResource) {
        super(parent);
        this.data = ss;
        this.name = nonNullProp(this.data, 'name');
        this.id = nonNullProp(this.data, 'id');
        this.resourceGroup = getResourceGroupFromId(this.id);
        this.label = this.name;
        this.repositoryUrl = nonNullProp(this.data, 'repositoryUrl');
        this.branch = nonNullProp(this.data, 'branch');
        this.defaultHostname = nonNullProp(this.data, 'defaultHostname');
    }

    public get description(): string | undefined {
        const { owner, name } = getRepoFullname(this.repositoryUrl);
        return `${owner}/${name}`;
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getThemedIconPath('azure-staticwebapps');
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        const client: WebSiteManagementClient = await createWebSiteClient(this.root);

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

    public async deleteTreeItemImpl(): Promise<void> {
        const deleting: string = localize('deleting', 'Deleting static web app "{0}"...', this.name);
        await window.withProgress({ location: ProgressLocation.Notification, title: deleting }, async (): Promise<void> => {
            ext.outputChannel.appendLog(deleting);
            const client: WebSiteManagementClient = await createWebSiteClient(this.root);
            // the client API call only awaits the call, but doesn't poll for the result so we handle that ourself
            await pollAzureAsyncOperation(await client.staticSites.deleteStaticSite(this.resourceGroup, this.name), this.root.credentials);

            const deleteSucceeded: string = localize('deleteSucceeded', 'Successfully deleted static web app "{0}".', this.name);
            window.showInformationMessage(deleteSucceeded);
            ext.outputChannel.appendLog(deleteSucceeded);
        });
    }

    public async browse(): Promise<void> {
        await openUrl(`https://${this.defaultHostname}`);
    }
}
