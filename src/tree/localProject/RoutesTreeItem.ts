/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzExtParentTreeItem, AzExtTreeItem, TreeItemIconPath } from "vscode-azureextensionui";
import { localize } from "../../utils/localize";
import { treeUtils } from "../../utils/treeUtils";
import { LocalProjectTreeItem } from "./LocalProjectTreeItem";

export class RoutesTreeItem extends AzExtParentTreeItem {
    public static contextValue: string = 'azureStaticRoutes';
    public contextValue: string = RoutesTreeItem.contextValue;
    public readonly label: string = localize('routes', 'Routes');
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
        return [];
    }
}
