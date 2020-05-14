/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureTreeItem, TreeItemIconPath } from "vscode-azureextensionui";
import { treeUtils } from "../utils/treeUtils";
import { FunctionsTreeItem } from "./FunctionsTreeItem";

export class FunctionTreeItem extends AzureTreeItem {

    public static contextValue: string = 'azureStaticFunction';
    public readonly contextValue: string = FunctionTreeItem.contextValue;
    public data: { id: string; name: string };

    constructor(parent: FunctionsTreeItem, func: { id: string; name: string }) {
        super(parent);
        this.data = func;
    }

    public get name(): string {
        return this.data.name;
    }

    public get id(): string {
        return this.data.id;
    }

    public get label(): string {
        return this.name;
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getIconPath('azFuncFunction');
    }
}
