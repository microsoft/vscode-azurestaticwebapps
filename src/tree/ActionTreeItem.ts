/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit } from '@octokit/rest';
import { ActionsGetWorkflowRunResponseData, ActionsListJobsForWorkflowRunResponseData, OctokitResponse } from '@octokit/types';
import { AzExtTreeItem, AzureParentTreeItem, IActionContext, TreeItemIconPath } from "vscode-azureextensionui";
import { createOctokitClient } from '../commands/github/createOctokitClient';
import { ensureStatus, getActionIconPath } from '../utils/actionUtils';
import { getRepoFullname } from '../utils/gitHubUtils';
import { ActionsTreeItem } from "./ActionsTreeItem";
import { IAzureResourceTreeItem } from './IAzureResourceTreeItem';
import { JobTreeItem } from './JobTreeItem';

export class ActionTreeItem extends AzureParentTreeItem implements IAzureResourceTreeItem {
    public static contextValueCompleted: string = 'azureStaticActionCompleted';
    public static contextValueInProgress: string = 'azureStaticActionInProgress';
    public parent: ActionsTreeItem;
    public data: ActionsGetWorkflowRunResponseData;

    constructor(parent: ActionsTreeItem, data: ActionsGetWorkflowRunResponseData) {
        super(parent);
        this.data = data;
    }

    public get contextValue(): string {
        return ensureStatus(this.data) === 'completed' ? ActionTreeItem.contextValueCompleted : ActionTreeItem.contextValueInProgress;
    }

    public get iconPath(): TreeItemIconPath {
        return getActionIconPath(this.data);
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

    public async loadMoreChildrenImpl(_clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        const { owner, name } = getRepoFullname(this.parent.repositoryUrl);
        const octokitClient: Octokit = await createOctokitClient(context);
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

    public async refreshImpl(context: IActionContext): Promise<void> {
        const { owner, name } = getRepoFullname(this.parent.repositoryUrl);
        const octokitClient: Octokit = await createOctokitClient(context);
        const response: OctokitResponse<ActionsGetWorkflowRunResponseData> = await octokitClient.actions.getWorkflowRun({ owner: owner, repo: name, run_id: this.data.id });
        this.data = response.data;
    }

    public compareChildrenImpl(ti1: JobTreeItem, ti2: JobTreeItem): number {
        // sort by the jobs that started first
        return ti1.startedDate.getTime() - ti2.startedDate.getTime();
    }

    public isAncestorOfImpl(contextValue: string | RegExp): boolean {
        return contextValue !== ActionTreeItem.contextValueCompleted && contextValue !== ActionTreeItem.contextValueInProgress;
    }
}
