/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureTreeItem, TreeItemIconPath } from "vscode-azureextensionui";
import { openUrl } from "../utils/openUrl";
import { treeUtils } from "../utils/treeUtils";
import { EnvironmentsTreeItem } from "./EnvironmentsTreeItem";

export type StaticWebAppBuild = {
    buildId: string;
    id: string;
    name: string;
    properties: {
        pullRequestTitle: string;
        sourceBranch: string;
        hostname: string;
    };
};

export class BuildTreeItem extends AzureTreeItem {
    public static contextValue: string = 'azureStaticBuild';
    public readonly contextValue: string = BuildTreeItem.contextValue;
    private readonly data: StaticWebAppBuild;

    constructor(parent: EnvironmentsTreeItem, build: StaticWebAppBuild) {
        super(parent);
        this.data = build;
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

    public async browse(): Promise<void> {
        await openUrl(`https://${this.data.properties.hostname}`);
    }
}
