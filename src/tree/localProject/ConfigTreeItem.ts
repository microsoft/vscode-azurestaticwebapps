/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzExtTreeItem, TreeItemIconPath } from "vscode-azureextensionui";
import { treeUtils } from "../../utils/treeUtils";
import { BuildConfig, ConfigGroupTreeItem } from "./ConfigGroupTreeItem";

export class ConfigTreeItem extends AzExtTreeItem {
    public static contextValue: string = 'azureStaticConfig';
    public contextValue: string = ConfigTreeItem.contextValue;
    public commandId: string = 'staticWebApps.openYAMLConfigFile';
    public commandArgs: unknown[];
    public readonly buildConfig: string;
    public parent: ConfigGroupTreeItem;

    public constructor(parent: ConfigGroupTreeItem, buildConfig: BuildConfig) {
        super(parent);
        this.buildConfig = buildConfig;
        this.commandArgs = [this.parent.parent, this.buildConfig];
    }

    public get label(): string {
        return this.buildConfig;
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getThemedIconPath('constant');
    }
}
