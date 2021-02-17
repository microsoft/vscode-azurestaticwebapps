/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ThemeIcon } from "vscode";
import { AzExtTreeItem, TreeItemIconPath } from "vscode-azureextensionui";
import { ConfigGroupTreeItem } from "./ConfigGroupTreeItem";

export class ConfigTreeItem extends AzExtTreeItem {
    public static contextValue: string = 'azureStaticConfig';
    public contextValue: string = ConfigTreeItem.contextValue;
    public readonly label: string;
    public parent: ConfigGroupTreeItem;

    public constructor(parent: ConfigGroupTreeItem, label: string) {
        super(parent);
        this.label = label;
    }

    public get iconPath(): TreeItemIconPath {
        return new ThemeIcon('gear');
    }
}
