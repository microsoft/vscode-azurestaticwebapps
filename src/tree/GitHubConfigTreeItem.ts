/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ThemeIcon } from "vscode";
import { AzExtTreeItem, TreeItemIconPath } from "vscode-azureextensionui";
import { BuildConfig, GitHubConfigGroupTreeItem } from "./GitHubConfigGroupTreeItem";

export class GitHubConfigTreeItem extends AzExtTreeItem {
    public static contextValue: string = 'azureStaticGitHubConfig';
    public contextValue: string = GitHubConfigTreeItem.contextValue;

    public commandArgs: unknown[];
    public readonly buildConfig: string;
    public buildConfigValue: string;
    public parent: GitHubConfigGroupTreeItem;

    public constructor(parent: GitHubConfigGroupTreeItem, buildConfig: BuildConfig, buildConfigValue: string) {
        super(parent);
        this.buildConfig = buildConfig;
        this.buildConfigValue = buildConfigValue;

        this.commandId = 'staticWebApps.openYAMLConfigFile';
        this.commandArgs = [this.parent, this.buildConfig];
    }

    public get label(): string {
        return `${this.buildConfig}="${this.buildConfigValue}"`;
    }

    public get iconPath(): TreeItemIconPath {
        return new ThemeIcon('symbol-constant');
    }
}
