/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementClient, WebSiteManagementModels } from "@azure/arm-appservice";
import { AzExtTreeItem, AzureParentTreeItem, GenericTreeItem, IActionContext, TreeItemIconPath } from "vscode-azureextensionui";
import { createWebSiteClient } from "../utils/azureClients";
import { localize } from '../utils/localize';
import { treeUtils } from "../utils/treeUtils";
import { EnvironmentTreeItem } from "./EnvironmentTreeItem";
import { FunctionTreeItem } from "./FunctionTreeItem";

export class FunctionsTreeItem extends AzureParentTreeItem {

    public static contextValue: string = 'azureStaticFunctions';
    public readonly contextValue: string = FunctionsTreeItem.contextValue;
    public parent: EnvironmentTreeItem;

    constructor(parent: EnvironmentTreeItem) {
        super(parent);
        this.parent = parent;
    }

    public get id(): string {
        return 'functionsList';
    }

    public get label(): string {
        return 'Functions';
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getThemedIconPath('list-unordered');
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, _context: IActionContext): Promise<AzExtTreeItem[]> {
        const client: WebSiteManagementClient = await createWebSiteClient(this.root);
        const functions: WebSiteManagementModels.StaticSiteFunctionOverviewCollection = await client.staticSites.listStaticSiteBuildFunctions(this.parent.parent.resourceGroup, this.parent.parent.name, this.parent.buildId);
        const treeItems: AzExtTreeItem[] = await this.createTreeItemsWithErrorHandling(
            functions,
            'invalidFunction',
            func => new FunctionTreeItem(this, func),
            func => func.name);

        if (treeItems.length === 0) {
            return [new GenericTreeItem(this, { label: localize('noFunctions', 'No Functions have been pushed to this Static Web App.'), contextValue: 'noFunctions' })];
        } else {
            return treeItems;
        }
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }
}
