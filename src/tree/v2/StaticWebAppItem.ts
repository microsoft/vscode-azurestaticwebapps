/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { StaticSiteARMResource, WebSiteManagementClient } from "@azure/arm-appservice";
import { getResourceGroupFromId } from "@microsoft/vscode-azext-azureutils";
import { callWithTelemetryAndErrorHandling, createContextValue, createSubscriptionContext, nonNullProp, nonNullValueAndProp, TreeElementBase, type IActionContext } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription, type ViewPropertiesModel } from "@microsoft/vscode-azureresources-api";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { onlyGitHubSupported } from "../../constants";
import { createWebSiteClient } from "../../utils/azureClients";
import { getRepoFullname } from "../../utils/gitUtils";
import { treeUtils } from "../../utils/treeUtils";

export interface StaticWebAppModel extends StaticSiteARMResource {
    id: string;
    name: string;
    resourceGroup: string;
}

export class StaticWebAppItem {
    static readonly contextValue: string = 'staticWebAppItem';
    static readonly contextValueRegExp: RegExp = new RegExp(StaticWebAppItem.contextValue);
    // Todo: childTypeLabel?

    id: string;
    name: string;
    repositoryUrl: string;

    constructor(
        context: IActionContext,
        readonly subscription: AzureSubscription,
        private _staticWebApp: StaticWebAppModel,
    ) {
        this.id = nonNullValueAndProp(this._staticWebApp, 'id');
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
        const result = await callWithTelemetryAndErrorHandling('staticWebAppItem.getChildren', async (_context: IActionContext) => {
            // Todo: Implement later
            return undefined;
        });

        return result ?? [];
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

// Todo: Delete tree item impl
// Todo: Compare children impl
// Todo: Browse
