/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { StaticSiteARMResource, StaticSiteBuildARMResource, WebSiteManagementClient } from "@azure/arm-appservice";
import { getResourceGroupFromId, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { callWithTelemetryAndErrorHandling, createContextValue, createGenericElement, createSubscriptionContext, createUniversallyUniqueContextValue, ISubscriptionContext, nonNullProp, nonNullValueAndProp, TreeElementBase, type IActionContext } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription, type ViewPropertiesModel } from "@microsoft/vscode-azureresources-api";
import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode";
import { onlyGitHubSupported } from "../../constants";
import { createWebSiteClient } from "../../utils/azureClients";
import { getRepoFullname } from "../../utils/gitUtils";
import { localize } from "../../utils/localize";
import { treeUtils } from "../../utils/treeUtils";
import { EnvironmentItem } from "./EnvironmentItem";
import { StaticWebAppsItem } from "./StaticWebAppsBranchDataProvider";

export interface StaticWebAppModel extends StaticSiteARMResource {
    id: string;
    name: string;
    resourceGroup: string;
}

export class StaticWebAppItem implements StaticWebAppsItem {
    static readonly contextValue: string = 'staticWebAppItem';
    static readonly contextValueRegExp: RegExp = new RegExp(StaticWebAppItem.contextValue);

    id: string;
    name: string;
    repositoryUrl: string;

    constructor(
        context: IActionContext,
        readonly subscription: AzureSubscription,
        private _staticWebApp: StaticWebAppModel,
    ) {
        this.id = nonNullProp(this._staticWebApp, 'id');
        this.name = nonNullProp(this._staticWebApp, 'name');

        if (this._staticWebApp.repositoryUrl) {
            this.repositoryUrl = this._staticWebApp.repositoryUrl;
        } else {
            context.errorHandling.suppressDisplay = true;
            throw new Error(onlyGitHubSupported);
        }
    }

    getTreeItem(): TreeItem {
        return {
            id: this.id,
            label: this.name,
            description: this.description,
            contextValue: this.contextValue,
            iconPath: treeUtils.getIconPath('azure-staticwebapps'),
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        };
    }

    async getChildren(): Promise<TreeElementBase[]> {
        const children: EnvironmentItem[] | undefined = await callWithTelemetryAndErrorHandling('staticWebAppItem.getChildren', async (context: IActionContext) => {
            const subscriptionContext: ISubscriptionContext = createSubscriptionContext(this.subscription);
            const client: WebSiteManagementClient = await createWebSiteClient([context, subscriptionContext]);
            const staticSiteBuilds: StaticSiteBuildARMResource[] = await uiUtils.listAllIterator(client.staticSites.listStaticSiteBuilds(this.resourceGroup, this.name));
            return Promise.all(staticSiteBuilds.map(async (ssb) => await EnvironmentItem.createEnvironmentItem(context, this.subscription, this.staticWebApp, ssb)));
        });

        return children ?? [
            createGenericElement({
                label: localize('failedToListStaticSiteBuilds', 'Failed to list static site builds.'),
                contextValue: createUniversallyUniqueContextValue(['invalidTreeItem']),
                description: localize('invalid', 'Invalid'),
                iconPath: new ThemeIcon('warning'),
            }),
        ];
    }

    static async Get(context: IActionContext, subscription: AzureSubscription, resourceGroup: string, name: string): Promise<StaticWebAppModel> {
        const subscriptionContext = createSubscriptionContext(subscription);
        const client: WebSiteManagementClient = await createWebSiteClient([context, subscriptionContext]);
        return StaticWebAppItem.CreateStaticWebAppModel(await client.staticSites.getStaticSite(resourceGroup, name));
    }

    static CreateStaticWebAppModel(staticWebApp: StaticSiteARMResource): StaticWebAppModel {
        const swaId: string = nonNullProp(staticWebApp, 'id');
        return {
            ...staticWebApp,
            id: swaId,
            name: nonNullProp(staticWebApp, 'name'),
            resourceGroup: getResourceGroupFromId(swaId),
        };
    }

    viewProperties: ViewPropertiesModel = {
        label: nonNullValueAndProp(this.staticWebApp, 'name'),
        data: this.staticWebApp,
    }

    get browseUrl(): string {
        return `https://${this.staticWebApp.defaultHostname}`;
    }

    get contextValue(): string {
        const values: string[] = [StaticWebAppItem.contextValue];
        return createContextValue(values);
    }

    get description(): string | undefined {
        const { owner, name } = getRepoFullname(this.repositoryUrl);
        return `${owner}/${name}`;
    }

    get resourceGroup(): string {
        return getResourceGroupFromId(this.id);
    }

    get staticWebApp(): StaticWebAppModel {
        return this._staticWebApp;
    }
}

// Todo: Compare children impl
// Todo: Browse
