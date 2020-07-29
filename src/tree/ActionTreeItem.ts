/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit } from '@octokit/rest';
import { ActionsGetWorkflowRunResponseData, ActionsListJobsForWorkflowRunResponseData, OctokitResponse } from '@octokit/types';
import { AzExtTreeItem, AzureParentTreeItem, IActionContext, TreeItemIconPath } from "vscode-azureextensionui";
import { createOctokitClient } from '../commands/github/createOctokitClient';
import { Conclusion, Status } from '../gitHubTypings';
import { getRepoFullname } from '../utils/gitHubUtils';
import { treeUtils } from "../utils/treeUtils";
import { ActionsTreeItem } from "./ActionsTreeItem";
import { IAzureResourceTreeItem } from './IAzureResourceTreeItem';
import { JobTreeItem } from './JobTreeItem';

export class ActionTreeItem extends AzureParentTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'azureStaticAction';
    public readonly contextValue: string = ActionTreeItem.contextValue;
    public parent: ActionsTreeItem;
    public data: ActionsGetWorkflowRunResponseData;

    constructor(parent: ActionsTreeItem, data: ActionsGetWorkflowRunResponseData) {
        super(parent);
        this.data = data;
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getActionIconPath(<Status>this.data.status, <Conclusion>this.data.conclusion);
    }

    public get id(): string {
        return this.data.id.toString();
    }

    public get name(): string {
        return this.data.head_commit.message;
    }

    public get label(): string {
        return this.name;
    }

    public get description(): string {
        return this.data.event;
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, _context: IActionContext): Promise<AzExtTreeItem[]> {
        const { owner, name } = getRepoFullname(this.parent.repositoryUrl);
        const octokitClient: Octokit = await createOctokitClient();
        const response: OctokitResponse<ActionsListJobsForWorkflowRunResponseData> = await octokitClient.actions.listJobsForWorkflowRun({ owner: owner, repo: name, run_id: this.data.id });

        return await this.createTreeItemsWithErrorHandling(
            response.data.jobs,
            'invalidJobTreeItem',
            (job) => new JobTreeItem(this, job),
            job => job.name
        );
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async refreshImpl(): Promise<void> {
        const { owner, name } = getRepoFullname(this.parent.repositoryUrl);
        const octokitClient: Octokit = await createOctokitClient();
        const response: OctokitResponse<ActionsGetWorkflowRunResponseData> = await octokitClient.actions.getWorkflowRun({ owner: owner, repo: name, run_id: this.data.id });
        this.data = response.data;
    }

    public compareChildrenImpl(ti1: JobTreeItem, ti2: JobTreeItem): number {
        // sort by the jobs that started first
        return ti1.startedDate.getTime() - ti2.startedDate.getTime();
    }
}
