/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { pathExists, readdir } from "fs-extra";
import { basename, join } from "path";
import { AzExtParentTreeItem, AzExtTreeItem, GenericTreeItem, IGenericTreeItemOptions, TreeItemIconPath } from "vscode-azureextensionui";
import { localize } from "../../utils/localize";
import { treeUtils } from "../../utils/treeUtils";
import { ConfigGroupTreeItem } from "./ConfigGroupTreeItem";

export class LocalProjectTreeItem extends AzExtParentTreeItem {
    public static contextValue: string = 'azureStaticLocalProject';
    public contextValue: string = LocalProjectTreeItem.contextValue;
    public readonly label: string = localize('localProject', 'Local Project');
    public readonly projectPath: string;

    private readonly _projectName: string;

    public constructor(parent: AzExtParentTreeItem, projectPath: string) {
        super(parent);
        this.projectPath = projectPath;
        this._projectName = basename(projectPath);
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getThemedIconPath('azure-staticwebapps');
    }

    public get id(): string {
        return 'localProject' + this._projectName;
    }

    public get description(): string {
        return this._projectName;
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async loadMoreChildrenImpl(): Promise<AzExtTreeItem[]> {
        const workflows: string[] = await this.getWorkflows(this.projectPath);
        if (workflows.length) {
            return [new ConfigGroupTreeItem(this)];
        } else {
            const options: IGenericTreeItemOptions = {
                label: 'Create Static Web App from Local Project...',
                iconPath: treeUtils.getThemedIconPath('add'),
                commandId: 'staticWebApps.createStaticWebAppFromLocalProject',
                contextValue: 'createStaticWebAppFromLocalProject'
            };
            const treeItem: GenericTreeItem = new GenericTreeItem(this, options);
            treeItem.commandArgs = [this.projectPath];
            return [treeItem];
        }
    }

    public isAncestorOfImpl(): boolean {
        return false;
    }

    private async getWorkflows(projectPath: string): Promise<string[]> {
        const workflowsPath: string = join(projectPath, '.github', 'workflows');
        const dirListing: string[] = await pathExists(workflowsPath) && await readdir(workflowsPath) || [];
        return dirListing.filter(file => /\.(yml|yaml)$/i.test(file));
    }
}
