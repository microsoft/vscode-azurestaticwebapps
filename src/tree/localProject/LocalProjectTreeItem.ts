/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { pathExists, readdir } from "fs-extra";
import { basename, join } from "path";
import { ThemeIcon } from "vscode";
import { AzExtParentTreeItem, AzExtTreeItem, GenericTreeItem, IGenericTreeItemOptions, TreeItemIconPath } from "vscode-azureextensionui";
import { localize } from "../../utils/localize";

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
        return new ThemeIcon('folder');
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
        const localWorkflows: string[] = await this.getLocalWorkflows(this.projectPath);
        if (localWorkflows.length) {
            return [];
        } else {
            const options: IGenericTreeItemOptions = {
                label: localize('createSWA', 'Create Static Web App from Local Project...'),
                iconPath: new ThemeIcon('add'),
                commandId: 'staticWebApps.createStaticWebAppFromLocalProject',
                contextValue: 'createStaticWebAppFromLocalProject'
            };
            const treeItem: GenericTreeItem = new GenericTreeItem(this, options);
            treeItem.commandArgs = [this];
            return [treeItem];
        }
    }

    public isAncestorOfImpl(): boolean {
        return false;
    }

    private async getLocalWorkflows(projectPath: string): Promise<string[]> {
        const workflowsPath: string = join(projectPath, '.github', 'workflows');
        const dirListing: string[] = await pathExists(workflowsPath) && await readdir(workflowsPath) || [];
        return dirListing.filter(file => /\.(yml|yaml)$/i.test(file));
    }
}
