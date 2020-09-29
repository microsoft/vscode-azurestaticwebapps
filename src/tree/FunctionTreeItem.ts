/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementModels } from "@azure/arm-appservice";
import { AzureTreeItem, TreeItemIconPath } from "vscode-azureextensionui";
import { nonNullProp } from "../utils/nonNull";
import { treeUtils } from "../utils/treeUtils";
import { FunctionsTreeItem } from "./FunctionsTreeItem";

export class FunctionTreeItem extends AzureTreeItem {

    public static contextValue: string = 'azureStaticFunction';
    public readonly contextValue: string = FunctionTreeItem.contextValue;
    public data: WebSiteManagementModels.StaticSiteFunctionOverviewARMResource;

    constructor(parent: FunctionsTreeItem, func: WebSiteManagementModels.StaticSiteFunctionOverviewARMResource) {
        super(parent);
        this.data = func;
    }

    public get name(): string {
        return nonNullProp(this.data, 'functionName');
    }

    public get id(): string {
        return nonNullProp(this.data, 'id');
    }

    public get label(): string {
        return this.name;
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getIconPath('azFuncFunction');
    }
}
