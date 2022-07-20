/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { StaticSiteFunctionOverviewARMResource } from "@azure/arm-appservice";
import { AzExtTreeItem, nonNullProp, TreeItemIconPath } from "@microsoft/vscode-azext-utils";
import { treeUtils } from "../utils/treeUtils";
import { FunctionsTreeItem } from "./FunctionsTreeItem";

export class FunctionTreeItem extends AzExtTreeItem {

    public static contextValue: string = 'azureStaticFunction';
    public readonly contextValue: string = FunctionTreeItem.contextValue;
    public data: StaticSiteFunctionOverviewARMResource;

    constructor(parent: FunctionsTreeItem, func: StaticSiteFunctionOverviewARMResource) {
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
