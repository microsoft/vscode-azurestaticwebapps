/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzExtParentTreeItem, AzExtTreeItem, TreeItemIconPath } from "vscode-azureextensionui";
import { localize } from "../../utils/localize";
import { treeUtils } from "../../utils/treeUtils";
import { ConfigTreeItem } from "./ConfigTreeItem";
import { LocalProjectTreeItem } from "./LocalProjectTreeItem";

export class ConfigGroupTreeItem extends AzExtParentTreeItem {
    public static contextValue: string = 'azureStaticConfigGroup';
    public contextValue: string = ConfigGroupTreeItem.contextValue;
    public readonly label: string = localize('config', 'Configuration');
    public parent: LocalProjectTreeItem;

    public constructor(parent: LocalProjectTreeItem) {
        super(parent);
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getThemedIconPath('settings');
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async loadMoreChildrenImpl(): Promise<AzExtTreeItem[]> {
        const buildSettings: string[] = ['app_location', 'api_location', 'app_artifact_location'];
        return await this.createTreeItemsWithErrorHandling(
            buildSettings,
            'azureStaticConfigInvalid',
            (setting: string) => new ConfigTreeItem(this, setting),
            (setting: string) => setting
        );
    }
}
