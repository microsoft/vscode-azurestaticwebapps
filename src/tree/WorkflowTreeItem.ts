/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzExtTreeItem, TreeItemIconPath } from "@microsoft/vscode-azext-utils";
import { ThemeIcon } from "vscode";
import { BuildConfig, WorkflowGroupTreeItem } from "./WorkflowGroupTreeItem";

export class WorkflowTreeItem extends AzExtTreeItem {
    public static contextValue: string = 'azureStaticWorkflow';
    public contextValue: string = WorkflowTreeItem.contextValue;

    public commandArgs: unknown[];
    public readonly buildConfig: string;
    public buildConfigValue: string;
    public parent!: WorkflowGroupTreeItem;

    public constructor(parent: WorkflowGroupTreeItem, buildConfig: BuildConfig, buildConfigValue: string) {
        super(parent);
        this.buildConfig = buildConfig;
        this.buildConfigValue = buildConfigValue;

        this.commandId = 'staticWebApps.openYAMLConfigFile';
        this.commandArgs = [this.parent, undefined, this.buildConfig];
    }

    public get label(): string {
        return `${this.buildConfig}="${this.buildConfigValue}"`;
    }

    public get iconPath(): TreeItemIconPath {
        return new ThemeIcon('symbol-constant');
    }
}
