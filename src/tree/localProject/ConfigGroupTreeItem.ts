/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzExtParentTreeItem, AzExtTreeItem, TreeItemIconPath } from "vscode-azureextensionui";
import { localize } from "../../utils/localize";
import { treeUtils } from "../../utils/treeUtils";
import { EnvironmentTreeItem } from "../EnvironmentTreeItem";
import { ConfigTreeItem } from "./ConfigTreeItem";

export type BuildConfig = 'app_location' | 'api_location' | 'output_location';

export class ConfigGroupTreeItem extends AzExtParentTreeItem {
    public static contextValue: string = 'azureStaticConfigGroup';
    public contextValue: string = ConfigGroupTreeItem.contextValue;
    public readonly label: string = localize('config', 'Configuration');
    public parent: EnvironmentTreeItem;

    public constructor(parent: EnvironmentTreeItem) {
        super(parent);
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getThemedIconPath('settings');
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async loadMoreChildrenImpl(): Promise<AzExtTreeItem[]> {
        const buildConfigs: BuildConfig[] = ['app_location', 'api_location', 'output_location'];
        return await this.createTreeItemsWithErrorHandling(
            buildConfigs,
            'azureStaticConfigInvalid',
            (config: BuildConfig) => new ConfigTreeItem(this, config),
            (config: BuildConfig) => config
        );
    }
}
