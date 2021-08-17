/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { pathExists, readdir } from "fs-extra";
import { basename, join } from "path";
import { Range, ThemeIcon } from "vscode";
import { AzExtParentTreeItem, AzExtTreeItem, GenericTreeItem, IActionContext, parseError, TreeItemIconPath } from "vscode-azureextensionui";
// eslint-disable-next-line import/no-internal-modules
import { YAMLSyntaxError } from "yaml/util";
import { localize } from "../utils/localize";
import { parseYamlFile } from "../utils/yamlUtils";
import { EnvironmentTreeItem } from "./EnvironmentTreeItem";
import { GitHubConfigTreeItem } from "./GitHubConfigTreeItem";

export type BuildConfig = 'app_location' | 'api_location' | 'output_location' | 'app_artifact_location';

export type BuildConfigs = {
    'app_location'?: string,
    'api_location'?: string,
    'output_location'?: string,
    'app_artifact_location'?: string
}

function getRangeFromError(error: YAMLSyntaxError): Range {
    if (error.linePos) {
        const { start, end } = error.linePos;
        return new Range(start.line - 1, start.col - 1, end.line - 1, end.col - 1);
    }
    return new Range(0, 0, 0, 0);
}

function getYamlErrorMessage(error: unknown): string {
    if (error instanceof YAMLSyntaxError) {
        const range = getRangeFromError(error);
        return `Error: Invalid YAML between lines ${range.start.line} and ${range.end.line}`;
    } else {
        return parseError(error).message;
    }
}

export class GitHubConfigGroupTreeItem extends AzExtParentTreeItem {
    public static contextValue: string = 'azureStaticGitHubConfigGroup';
    public contextValue: string = GitHubConfigGroupTreeItem.contextValue;
    public parent: EnvironmentTreeItem;
    public yamlFilePath: string;
    public buildConfigs: BuildConfigs | undefined;

    public constructor(parent: EnvironmentTreeItem, yamlFilePath: string, buildConfigs: BuildConfigs, public parseYamlError?: unknown) {
        super(parent);
        this.yamlFilePath = yamlFilePath;
        this.buildConfigs = buildConfigs;
        this.id = `${parent.id}-${this.yamlFilePath}`;
        this.commandArgs = [this];
    }

    public get label(): string {
        return this.parseYamlError ? localize('invalidGitHubConfig', 'Invalid GitHub Configuration') : localize('gitHubConfig', 'GitHub Configuration');
    }

    public get commandId(): string | undefined {
        return this.parseYamlError ? 'staticWebApps.openYAMLConfigFile' : undefined;
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
                try {
                    const buildConfigs: BuildConfigs | undefined = await parseYamlFile(context, yamlFilePath);
                    buildConfigs && treeItems.push(new GitHubConfigGroupTreeItem(parent, yamlFilePath, buildConfigs));
                } catch (e) {
                    treeItems.push(new GitHubConfigGroupTreeItem(parent, yamlFilePath, {}, e));
                }
            }
        }

        return treeItems;
    }

    public get iconPath(): TreeItemIconPath {
        return this.parseYamlError ? new ThemeIcon('warning') : new ThemeIcon('settings-gear');
    }

    public get description(): string {
        return basename(this.yamlFilePath);
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public get errorRange(): Range | undefined {
        return this.parseYamlError instanceof YAMLSyntaxError ? getRangeFromError(this.parseYamlError) : undefined;
    }

    public async loadMoreChildrenImpl(): Promise<AzExtTreeItem[]> {
        if (this.errorRange) {
            return [new GenericTreeItem(this, {
                label: getYamlErrorMessage(this.parseYamlError),
                contextValue: 'parseYamlErrorTreeItem'
            })];
        }

        const treeItems: GitHubConfigTreeItem[] = [];

        for (const buildConfig in this.buildConfigs) {
            const value: string | undefined = <string | undefined>this.buildConfigs[buildConfig];
            value !== undefined && treeItems.push(new GitHubConfigTreeItem(this, <BuildConfig>buildConfig, value));
        }

        return treeItems;
    }

    public async refreshImpl(context: IActionContext): Promise<void> {
        try {
            this.buildConfigs = await parseYamlFile(context, this.yamlFilePath);
            this.parseYamlError = undefined;
        } catch (e) {
            this.parseYamlError = e;
        }
    }
}
