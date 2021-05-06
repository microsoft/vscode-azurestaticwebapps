/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { pathExists, readdir } from "fs-extra";
import { basename, join } from "path";
import { ThemeIcon } from "vscode";
import { AzExtParentTreeItem, AzExtTreeItem, IActionContext, TreeItemIconPath } from "vscode-azureextensionui";
import { localize } from "../../utils/localize";
import { parseYamlFile } from "../../utils/yamlUtils";
import { EnvironmentTreeItem } from "../EnvironmentTreeItem";
import { GitHubConfigTreeItem } from "./ConfigTreeItem";

export type BuildConfig = 'app_location' | 'api_location' | 'output_location' | 'app_artifact_location';

export type BuildConfigs = {
    'app_location'?: string,
    'api_location'?: string,
    'output_location'?: string,
    'app_artifact_location'?: string
}

export class GitHubConfigGroupTreeItem extends AzExtParentTreeItem {
    public static contextValue: string = 'azureStaticGitHubConfigGroup';
    public contextValue: string = GitHubConfigGroupTreeItem.contextValue;
    public readonly label: string = localize('gitHubConfig', 'GitHub Configuration');
    public parent: EnvironmentTreeItem;
    public yamlFilePath: string;
    public buildConfigs: BuildConfigs | undefined;

    public constructor(parent: EnvironmentTreeItem, yamlFilePath: string, buildConfigs: BuildConfigs) {
        super(parent);
        this.yamlFilePath = yamlFilePath;
        this.buildConfigs = buildConfigs;
        this.id = `${parent.id}-${this.yamlFilePath}`;
    }

    public static async createGitHubConfigGroupTreeItems(context: IActionContext, parent: EnvironmentTreeItem): Promise<GitHubConfigGroupTreeItem[]> {
        const treeItems: GitHubConfigGroupTreeItem[] = [];

        if (parent.localProjectPath && parent.inWorkspace) {
            const workflowsDir: string = join(parent.localProjectPath, '.github/workflows');
            const yamlFiles: string[] = await pathExists(workflowsDir) ?
                (await readdir(workflowsDir)).filter(file => /\.(yml|yaml)$/i.test(file)) :
                [];

            context.telemetry.properties.numWorkflows = yamlFiles.length.toString();

            for (const yamlFile of yamlFiles) {
                const yamlFilePath: string = join(workflowsDir, yamlFile);
                const buildConfigs: BuildConfigs | undefined = await parseYamlFile(yamlFilePath);
                buildConfigs && treeItems.push(new GitHubConfigGroupTreeItem(parent, yamlFilePath, buildConfigs));
            }
        }

        return treeItems;
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

        for (const buildConfig in this.buildConfigs) {
            const value: string | undefined = <string | undefined>this.buildConfigs[buildConfig];
            value !== undefined && treeItems.push(new GitHubConfigTreeItem(this, <BuildConfig>buildConfig, value));
        }

        return treeItems;
    }

    public async refreshImpl(): Promise<void> {
        this.buildConfigs = await parseYamlFile(this.yamlFilePath);
    }
}
