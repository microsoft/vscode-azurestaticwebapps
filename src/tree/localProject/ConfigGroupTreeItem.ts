/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { pathExists, readdir } from "fs-extra";
import { basename, join } from "path";
import { ThemeIcon } from "vscode";
import { AzExtParentTreeItem, AzExtTreeItem, TreeItemIconPath } from "vscode-azureextensionui";
import { localize } from "../../utils/localize";
import { parseYamlFile } from "../../utils/yamlUtils";
import { EnvironmentTreeItem } from "../EnvironmentTreeItem";
import { GitHubConfigTreeItem } from "./ConfigTreeItem";

export type BuildConfig = 'app_location' | 'api_location' | 'app_artifact_location' | 'output_location';

export class GitHubConfigGroupTreeItem extends AzExtParentTreeItem {
    public static contextValue: string = 'azureStaticGitHubConfigGroup';
    public contextValue: string = GitHubConfigGroupTreeItem.contextValue;
    public readonly label: string = localize('gitHubConfig', 'GitHub Configuration');
    public parent: EnvironmentTreeItem;
    public yamlFilePath: string;
    public buildConfigs: Map<BuildConfig, string>;

    public constructor(parent: EnvironmentTreeItem, yamlFilePath: string, buildConfigs: Map<BuildConfig, string>) {
        super(parent);
        this.yamlFilePath = yamlFilePath;
        this.buildConfigs = buildConfigs;
        this.id = `${parent.id}-${this.yamlFilePath}`;
    }

    public static async createGitHubConfigGroupTreeItems(parent: EnvironmentTreeItem): Promise<GitHubConfigGroupTreeItem[]> {
        if (parent.localProjectPath && parent.inWorkspace) {
            const treeItems: GitHubConfigGroupTreeItem[] = [];
            const workflowsDir: string = join(parent.localProjectPath, '.github/workflows');
            const yamlFiles: string[] = await pathExists(workflowsDir) ?
                (await readdir(workflowsDir)).filter(file => /\.(yml|yaml)$/i.test(file)) :
                [];

            for (const yamlFile of yamlFiles) {
                const yamlFilePath: string = join(workflowsDir, yamlFile);
                const buildConfigs: Map<BuildConfig, string> | undefined = await parseYamlFile(yamlFilePath);
                buildConfigs && treeItems.push(new GitHubConfigGroupTreeItem(parent, yamlFilePath, buildConfigs));
            }

            return treeItems;
        }

        return [];
    }

    public get iconPath(): TreeItemIconPath {
        return new ThemeIcon('settings-gear');
    }

    public get description(): string {
        return basename(this.yamlFilePath);
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async loadMoreChildrenImpl(): Promise<AzExtTreeItem[]> {
        const treeItems: GitHubConfigTreeItem[] = [];
        this.buildConfigs.forEach((value: string, config: BuildConfig) => {
            treeItems.push(new GitHubConfigTreeItem(this, config, value));
        });
        return treeItems;
    }

    public async refreshImpl(): Promise<void> {
        const newBuildConfigs: Map<BuildConfig, string> | undefined = await parseYamlFile(this.yamlFilePath);
        this.buildConfigs = newBuildConfigs ? newBuildConfigs : new Map<BuildConfig, string>();
    }
}
