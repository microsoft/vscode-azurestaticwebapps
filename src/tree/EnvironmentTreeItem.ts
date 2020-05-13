/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureParentTreeItem, IActionContext, TreeItemIconPath } from "vscode-azureextensionui";
import { openUrl } from "../utils/openUrl";
import { treeUtils } from "../utils/treeUtils";
import { AppSettingsTreeItem } from "./AppSettingsTreeItem";
import { EnvironmentsTreeItem } from "./EnvironmentsTreeItem";
import { IAzureResourceTreeItem } from "./IAzureResourceTreeItem";

export type StaticEnvironment = {
    buildId: string;
    id: string;
    name: string;
    properties: {
        pullRequestTitle: string;
        sourceBranch: string;
        hostname: string;
    };
};

export class EnvironmentTreeItem extends AzureParentTreeItem implements IAzureResourceTreeItem {

    public static contextValue: string = 'azureStaticEnvironment';
    public readonly contextValue: string = EnvironmentTreeItem.contextValue;
    public appSettingsTreeItem: AppSettingsTreeItem;
    public readonly data: StaticEnvironment;

    constructor(parent: EnvironmentsTreeItem, env: StaticEnvironment) {
        super(parent);
        this.data = env;
        this.appSettingsTreeItem = new AppSettingsTreeItem(this);
    }

    public get name(): string {
        return this.data.buildId;
    }

    public get id(): string {
        return this.data.id;
    }

    public get label(): string {
        return this.data.properties.pullRequestTitle;
    }

    public get description(): string | undefined {
        return this.data.properties.sourceBranch;
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getThemedIconPath('azure-staticwebapps');
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, _context: IActionContext): Promise<AzureParentTreeItem[]> {
        return [this.appSettingsTreeItem];
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async browse(): Promise<void> {
        await openUrl(`https://${this.data.properties.hostname}`);
    }
}
