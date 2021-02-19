/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { basename } from "path";
import { AzExtParentTreeItem, AzExtTreeItem, TreeItemIconPath } from "vscode-azureextensionui";
import { localize } from "../../utils/localize";
import { treeUtils } from "../../utils/treeUtils";
import { ConfigGroupTreeItem } from "./ConfigGroupTreeItem";

export class LocalProjectTreeItem extends AzExtParentTreeItem {
    public static contextValue: string = 'azureStaticLocalProject';
    public contextValue: string = LocalProjectTreeItem.contextValue;
    public readonly label: string = localize('localProject', 'Local Project');
    public readonly projectPath: string;

    private readonly _projectName: string;

    public constructor(parent: AzExtParentTreeItem, projectPath: string) {
        super(parent);
        this.projectPath = projectPath;
        this._projectName = basename(projectPath);
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getThemedIconPath('azure-staticwebapps');
    }

    public get id(): string {
        return 'localProject' + this._projectName;
    }

    public get description(): string {
        return this._projectName;
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async loadMoreChildrenImpl(): Promise<AzExtTreeItem[]> {
        return [new ConfigGroupTreeItem(this)];
    }
}
