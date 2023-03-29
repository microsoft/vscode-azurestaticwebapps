/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra, AzExtParentTreeItem, AzExtTreeItem, GenericTreeItem, IActionContext, parseError, TreeItemIconPath } from "@microsoft/vscode-azext-utils";
import { basename, join } from "path";
import { FileType, Range, ThemeIcon, workspace } from "vscode";
import { URI, Utils } from "vscode-uri";
// eslint-disable-next-line import/no-internal-modules
import { YAMLSyntaxError } from "yaml/util";
import { localize } from "../utils/localize";
import { parseYamlFile } from "../utils/yamlUtils";
import { EnvironmentTreeItem } from "./EnvironmentTreeItem";
import { WorkflowTreeItem } from "./WorkflowTreeItem";


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

export class WorkflowGroupTreeItem extends AzExtParentTreeItem {
    public static contextValue: string = 'azureStaticWorkflowGroup';
    public contextValue: string = WorkflowGroupTreeItem.contextValue;
    public parent!: EnvironmentTreeItem;
    public yamlFilePath: string;
    public buildConfigs: BuildConfigs | undefined;
    public parseYamlError: unknown;

    public constructor(parent: EnvironmentTreeItem, yamlFilePath: string) {
        super(parent);
        this.yamlFilePath = yamlFilePath;
        this.id = `${parent.id}-${this.yamlFilePath}`;
    }

    public get label(): string {
        return this.parseYamlError ? localize('invalidWorkflow', 'Invalid Workflow') : localize('workflow', 'Workflow');
    }

    public get commandId(): string | undefined {
        return this.parseYamlError ? 'staticWebApps.openYAMLConfigFile' : undefined;
    }

    public static async createGitHubConfigGroupTreeItems(context: IActionContext, parent: EnvironmentTreeItem): Promise<WorkflowGroupTreeItem[]> {
        const treeItems: WorkflowGroupTreeItem[] = [];

        if (parent.localProjectPath && parent.inWorkspace) {
            const workflowsDir: URI = Utils.joinPath(parent.localProjectPath, '.github/workflows');
            const yamlFiles: string[] = await AzExtFsExtra.pathExists(workflowsDir) ?
                (await workspace.fs.readDirectory(workflowsDir)).filter(file => file[1] === FileType.File && /\.(yml|yaml)$/i.test(file[0])).map(file => file[0]) :
                [];

            context.telemetry.properties.numWorkflows = yamlFiles.length.toString();

            for (const yamlFile of yamlFiles) {
                const ti = new WorkflowGroupTreeItem(parent, join(workflowsDir.fsPath, yamlFile));
                await ti.refreshImpl(context);
                treeItems.push(ti);
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
        if (this.parseYamlError) {
            const errorTreeItem = new GenericTreeItem(this, {
                label: getYamlErrorMessage(this.parseYamlError),
                contextValue: 'parseYamlErrorTreeItem',
                commandId: 'staticWebApps.openYAMLConfigFile'
            });
            errorTreeItem.commandArgs = [this];
            return [errorTreeItem];
        }

        const treeItems: WorkflowTreeItem[] = [];

        for (const buildConfig in this.buildConfigs) {
            const value: string | undefined = <string | undefined>this.buildConfigs[buildConfig as keyof BuildConfigs];
            value !== undefined && treeItems.push(new WorkflowTreeItem(this, <BuildConfig>buildConfig, value));
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
