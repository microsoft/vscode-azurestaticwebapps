/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { basename } from "path";
import { AzExtTreeItem, AzureParentTreeItem, GenericTreeItem, IActionContext, IGenericTreeItemOptions, TreeItemIconPath } from "vscode-azureextensionui";
import { tryGetRemote } from "../../utils/gitHubUtils";
import { localize } from "../../utils/localize";
import { treeUtils } from "../../utils/treeUtils";
import { AzureAccountTreeItemWithProjects } from "../AzureAccountTreeItemWithProjects";
import { StaticWebAppTreeItem } from "../StaticWebAppTreeItem";
import { ConfigGroupTreeItem } from "./ConfigGroupTreeItem";

export class LocalProjectTreeItem extends AzureParentTreeItem {
    public static contextValue: string = 'azureStaticLocalProject';
    public contextValue: string = LocalProjectTreeItem.contextValue;
    public readonly label: string = localize('localProject', 'Local Project');
    public readonly parent: AzureAccountTreeItemWithProjects;
    public readonly projectPath: string;

    private readonly _projectName: string;

    public constructor(parent: AzureAccountTreeItemWithProjects, projectPath: string) {
        super(parent);
        this.parent = parent;
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

    // eslint-disable-next-line @typescript-eslint/require-await
    public async loadMoreChildrenImpl(_clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        const treeItems: AzExtTreeItem[] = [new ConfigGroupTreeItem(this)];

        const repositoryUrl: string | undefined = (await tryGetRemote(context, this.projectPath))?.html_url;
        if (repositoryUrl) {
            const staticWebAppTreeItem: StaticWebAppTreeItem | undefined = await this.parent.findStaticWebAppTreeItem(context, repositoryUrl);
            if (staticWebAppTreeItem) {
                const options: IGenericTreeItemOptions = {
                    label: localize('reveal', 'Reveal connected Static Web App'),
                    iconPath: treeUtils.getThemedIconPath('link'),
                    commandId: 'staticWebApps.revealTreeItem',
                    contextValue: 'revealConnectedStaticWebApp'
                };
                const treeItem: GenericTreeItem = new GenericTreeItem(this, options);
                treeItem.commandArgs = [staticWebAppTreeItem];
                treeItems.push(treeItem);
            }
        }

        return treeItems;
    }
}
