/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit } from '@octokit/rest';
import { ActionsGetWorkflowRunResponseData, ActionsListJobsForWorkflowRunResponseData, OctokitResponse } from '@octokit/types';
import { AzExtTreeItem, AzureParentTreeItem, IActionContext, TreeItemIconPath } from "vscode-azureextensionui";
import { createOctokitClient } from '../commands/github/createOctokitClient';
import { Conclusion, Status } from '../constants';
import { getRepoFullname } from '../utils/gitHubUtils';
import { treeUtils } from "../utils/treeUtils";
import { ActionsTreeItem } from "./ActionsTreeItem";
import { IAzureResourceTreeItem } from './IAzureResourceTreeItem';
import { JobTreeItem } from './JobTreeItem';

export type GitHubAction = {
    id: number;
    conclusion: Conclusion;
    event: string;
    head_branch: string;
    status: Status;
    head_commit: { message: string };
    url: string;
    html_url: string;
    rerun_url: string;
    cancel_url: string;
};

export type GitHubJob = {
    id: number;
    run_id: number;
    run_url: string;
    node_id: string;
    head_sha: string;
    url: string;
    html_url: string;
    status: Status;
    conclusion: Conclusion | null;
    started_at: Date;
    completed_at: Date;
    name: string;
    steps: GitHubStep[];
    check_run_url: string;
};

export type GitHubStep = {
    name: string;
    status: Status;
    conclusion: Conclusion | null;
    // tslint:disable-next-line: no-reserved-keywords
    number: number;
    started_at: string;
    completed_at: string;
};

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
}
