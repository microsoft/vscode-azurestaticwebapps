/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ReposGetResponseData } from "@octokit/types";
import { pathExists, readdir } from "fs-extra";
import { basename, join } from "path";
import { ThemeIcon, Uri } from "vscode";
import { AzExtParentTreeItem, AzExtTreeItem, GenericTreeItem, IActionContext, IGenericTreeItemOptions, TreeItemIconPath } from "vscode-azureextensionui";
import { getGitApi } from "../../getExtensionApi";
import { API, Branch, Repository } from "../../git";
import { GitTreeData } from "../../gitHubTypings";
import { getGitHubTree, tryGetRemote } from "../../utils/gitHubUtils";
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

    public async loadMoreChildrenImpl(_clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        const localWorkflows: string[] = await this.getLocalWorkflows(this.projectPath);
        if (localWorkflows.length) {
            return [new ConfigGroupTreeItem(this)];
        } else {
            let options: IGenericTreeItemOptions;
            const remoteWorkflows: GitTreeData[] = await this.getRemoteWorkflows(context, this.projectPath);
            if (remoteWorkflows.length) {
                options = {
                    label: localize('gitPull', '"git pull" to get build configuration files from the remote'),
                    iconPath: new ThemeIcon('cloud-download'),
                    commandId: 'staticWebApps.gitPull',
                    contextValue: 'gitPull'
                };
            } else {
                options = {
                    label: localize('createSWA', 'Create Static Web App from Local Project...'),
                    iconPath: treeUtils.getThemedIconPath('add'),
                    commandId: 'staticWebApps.createStaticWebAppFromLocalProject',
                    contextValue: 'createStaticWebAppFromLocalProject'
                };
            }

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

    private async getRemoteWorkflows(context: IActionContext, projectPath: string): Promise<GitTreeData[]> {
        const repoData: ReposGetResponseData | undefined = await tryGetRemote(context, projectPath);
        const repoUrl: string | undefined = repoData?.git_url;

        if (repoUrl) {
            const git: API = await getGitApi();
            const projectUri: Uri = Uri.file(projectPath);
            const repo: Repository | null = git.getRepository(projectUri);
            const branch: Branch | undefined = await repo?.getBranch('HEAD');
            const branchName: string | undefined = branch?.name;

            if (branchName) {
                return await getGitHubTree(context, repoUrl, branchName);
            }
        }

        return [];
    }
}
