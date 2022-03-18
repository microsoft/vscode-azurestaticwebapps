/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementClient, WebSiteManagementModels } from "@azure/arm-appservice";
import { GenericResourceExpanded, ResourceManagementClient } from "@azure/arm-resources";
import { AzExtClientContext, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzExtParentTreeItem, AzExtTreeItem, IActionContext, ISubscriptionContext, TreeItemIconPath } from "@microsoft/vscode-azext-utils";
import { ProgressLocation, window } from "vscode";
import { AppResource, ResolvedAppResourceTreeItem } from "../api";
import { onlyGitHubSupported, productionEnvironmentName } from '../constants';
import { ext } from "../extensionVariables";
import { ResolvedStaticWebApp } from "../StaticWebAppResolver";
import { createResourceClient, createWebSiteClient } from "../utils/azureClients";
import { getResourceGroupFromId, pollAzureAsyncOperation } from "../utils/azureUtils";
import { createTreeItemsWithErrorHandling } from "../utils/createTreeItemsWithErrorHandling";
import { getRepoFullname } from '../utils/gitUtils';
import { localize } from "../utils/localize";
import { nonNullProp } from "../utils/nonNull";
import { openUrl } from '../utils/openUrl';
import { treeUtils } from "../utils/treeUtils";
import { EnvironmentTreeItem } from './EnvironmentTreeItem';

export type ResolvedStaticWebAppTreeItem = ResolvedAppResourceTreeItem<ResolvedStaticWebApp>;

export function isResolvedStaticWebAppTreeItem(t: unknown): t is ResolvedStaticWebAppTreeItem {
    return (t as ResolvedStaticWebApp)?.data?.type?.toLowerCase() === 'microsoft.web/staticsites';
}

export class StaticWebAppTreeItem implements ResolvedStaticWebApp {
    public static contextValue: string = 'azureStaticWebApp';
    public readonly data: WebSiteManagementModels.StaticSiteARMResource;
    public readonly childTypeLabel: string = localize('environment', 'Environment');

    public name: string;
    public resourceGroup: string;
    public label: string;
    public repositoryUrl: string;
    public branch: string;
    public defaultHostname: string;

    public contextValuesToAdd?: string[] = [];

    private readonly _subscription: ISubscriptionContext;

    constructor(subscription: ISubscriptionContext, ss: WebSiteManagementModels.StaticSiteARMResource & AppResource) {
        this.data = ss;
        this.name = nonNullProp(this.data, 'name');
        this.resourceGroup = getResourceGroupFromId(ss.id);
        this.label = this.name;
        this._subscription = subscription;

        this.contextValuesToAdd?.push(StaticWebAppTreeItem.contextValue);

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
        let client: WebSiteManagementClient;
        try {
            const clientContext: AzExtClientContext = [context, this._subscription];
            const subscription = clientContext[1] instanceof AzExtTreeItem ? clientContext[1].subscription : clientContext[1];
            console.log('subscription', subscription);
            client = await createWebSiteClient(clientContext);

        } catch (e) {
            console.error('error creating client in load more children', [context, this]);
            throw e;
        }
        const envs: WebSiteManagementModels.StaticSiteBuildCollection = await client.staticSites.getStaticSiteBuilds(this.resourceGroup, this.name);
        console.log('envs', envs);
        // extract to static utility on azextparenttreeitem
        return await createTreeItemsWithErrorHandling(
            undefined as unknown as AzExtParentTreeItem,
            envs,
            'invalidStaticEnvironment',
            async (env: WebSiteManagementModels.StaticSiteBuildARMResource) => {
                return await EnvironmentTreeItem.createEnvironmentTreeItem(context, this as unknown as AzExtParentTreeItem, env);
            },
            env => env.buildId
        );
    }

    // possibly return null to indicate to run super
    public compareChildrenImpl(ti1: AzExtTreeItem, ti2: AzExtTreeItem): number {
        // production environment should always be on top
        if (ti1.label === productionEnvironmentName) {
            return -1;
        } else if (ti2.label === productionEnvironmentName) {
            return 1;
        }

        // return super.compareChildrenImpl(ti1, ti2);
        return ti1.label.localeCompare(ti2.label);
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async deleteTreeItemImpl(context: IActionContext): Promise<void> {
        const deleting: string = localize('deleting', 'Deleting static web app "{0}"...', this.name);
        await window.withProgress({ location: ProgressLocation.Notification, title: deleting }, async (): Promise<void> => {
            ext.outputChannel.appendLog(deleting);

            const resourceClient: ResourceManagementClient = await createResourceClient([context, this._subscription]);
            const resources: GenericResourceExpanded[] = await uiUtils.listAllIterator(resourceClient.resources.listByResourceGroup(this.resourceGroup));

            const client: WebSiteManagementClient = await createWebSiteClient([context, this._subscription]);
            // the client API call only awaits the call, but doesn't poll for the result so we handle that ourself
            const deleteResponse = await client.staticSites.deleteStaticSite(this.resourceGroup, this.name);
            await pollAzureAsyncOperation(context, deleteResponse, this._subscription);

            const deleteSucceeded: string = localize('deleteSucceeded', 'Successfully deleted static web app "{0}".', this.name);
            void window.showInformationMessage(deleteSucceeded);
            ext.outputChannel.appendLog(deleteSucceeded);

            if (resources.length === 1) {
                void resourceClient.resourceGroups.beginDeleteAndWait(this.resourceGroup);
            }
        });
    }

    public async browse(): Promise<void> {
        await openUrl(`https://${this.defaultHostname}`);
    }
}
