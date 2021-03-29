/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzExtTreeItem, TreeItemIconPath } from "vscode-azureextensionui";
import { treeUtils } from "../../utils/treeUtils";
import { BuildConfig, GitHubConfigGroupTreeItem } from "./ConfigGroupTreeItem";

export class GitHubConfigTreeItem extends AzExtTreeItem {
    public static contextValue: string = 'azureStaticGitHubConfig';
    public contextValue: string = GitHubConfigTreeItem.contextValue;
    public commandId: string = 'staticWebApps.openYAMLConfigFile';
    public commandArgs: unknown[];
    public readonly buildConfig: string;
    public parent: GitHubConfigGroupTreeItem;

    public constructor(parent: GitHubConfigGroupTreeItem, buildConfig: BuildConfig) {
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
