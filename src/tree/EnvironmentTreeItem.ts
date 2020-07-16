/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AppSettingsTreeItem, AppSettingTreeItem } from "vscode-azureappservice";
import { AzExtParentTreeItem, AzExtTreeItem, AzureParentTreeItem, IActionContext, TreeItemIconPath } from "vscode-azureextensionui";
import { AppSettingsClient } from "../commands/appSettings/AppSettingsClient";
import { productionEnvironmentName } from "../constants";
import { openUrl } from "../utils/openUrl";
import { treeUtils } from "../utils/treeUtils";
import { ActionsTreeItem } from "./ActionsTreeItem";
import { ActionTreeItem } from "./ActionTreeItem";
import { FunctionsTreeItem } from "./FunctionsTreeItem";
import { FunctionTreeItem } from "./FunctionTreeItem";
import { IAzureResourceTreeItem } from "./IAzureResourceTreeItem";
import { StaticWebAppTreeItem } from "./StaticWebAppTreeItem";

export type StaticEnvironment = {
    buildId: string;
    id: string;
    name: string;
    properties: {
        buildId: string;
        pullRequestTitle: string;
        sourceBranch: string;
        hostname: string;
    };
};

export class EnvironmentTreeItem extends AzureParentTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'azureStaticEnvironment';
    public readonly contextValue: string = EnvironmentTreeItem.contextValue;

    public parent: StaticWebAppTreeItem;
    public actionsTreeItem: ActionsTreeItem;
    public appSettingsTreeItem: AppSettingsTreeItem;
    public functionsTreeItem: FunctionsTreeItem;
    public readonly data: StaticEnvironment;

    constructor(parent: StaticWebAppTreeItem, env: StaticEnvironment) {
        super(parent);
        this.data = env;
        this.actionsTreeItem = new ActionsTreeItem(this);
        this.appSettingsTreeItem = new AppSettingsTreeItem(this, new AppSettingsClient(this));
        this.functionsTreeItem = new FunctionsTreeItem(this);
    }

    public get name(): string {
        return this.data.name;
    }

    public get id(): string {
        return this.data.id;
    }

    public get label(): string {
        return this.data.properties.buildId === 'default' ? productionEnvironmentName : `#${this.name} - ${this.data.properties.pullRequestTitle}`;
    }

    public get description(): string | undefined {
        return this.data.properties.sourceBranch;
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getIconPath('Azure-Static-Apps-Environment');
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, _context: IActionContext): Promise<AzExtParentTreeItem[]> {
        return [this.actionsTreeItem, this.appSettingsTreeItem, this.functionsTreeItem];
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async browse(): Promise<void> {
        await openUrl(`https://${this.data.properties.hostname}`);
    }

    public async pickTreeItemImpl(expectedContextValues: (string | RegExp)[]): Promise<AzExtTreeItem | undefined> {
        for (const expectedContextValue of expectedContextValues) {
            switch (expectedContextValue) {
                case AppSettingsTreeItem.contextValue:
                case AppSettingTreeItem.contextValue:
                    return this.appSettingsTreeItem;
                case ActionsTreeItem.contextValue:
                case ActionTreeItem.contextValue:
                    return this.actionsTreeItem;
                case FunctionsTreeItem.contextValue:
                case FunctionTreeItem.contextValue:
                    return this.functionsTreeItem;
                default:
            }
        }

        return undefined;
    }
}
