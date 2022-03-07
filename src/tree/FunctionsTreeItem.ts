/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementClient } from "@azure/arm-appservice";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzExtParentTreeItem, AzExtTreeItem, GenericTreeItem, IActionContext, TreeItemIconPath } from "@microsoft/vscode-azext-utils";
import { ThemeIcon } from "vscode";
import { createWebSiteClient } from "../utils/azureClients";
import { localize } from '../utils/localize';
import { EnvironmentTreeItem } from "./EnvironmentTreeItem";
import { FunctionTreeItem } from "./FunctionTreeItem";

export class FunctionsTreeItem extends AzExtParentTreeItem {

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
        return new ThemeIcon('list-unordered');
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        const client: WebSiteManagementClient = await createWebSiteClient([context, this]);
        const functions = this.parent.isProduction ? await uiUtils.listAllIterator(client.staticSites.listStaticSiteFunctions(this.parent.parent.resourceGroup, this.parent.parent.name)) :
            await uiUtils.listAllIterator(client.staticSites.listStaticSiteBuildFunctions(this.parent.parent.resourceGroup, this.parent.parent.name, this.parent.buildId));

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
