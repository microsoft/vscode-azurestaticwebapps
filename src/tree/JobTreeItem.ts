/* eslint-disable @typescript-eslint/no-unsafe-call */
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit } from '@octokit/rest';
import { AzExtTreeItem, AzureParentTreeItem, IActionContext, TreeItemIconPath } from "vscode-azureextensionui";
import { createOctokitClient } from '../commands/github/createOctokitClient';
import { ActionsGetJobForWorkflowRunResponseData, JobLogsForWorkflowRun } from '../gitHubTypings';
import { getActionDescription, getActionIconPath } from '../utils/actionUtils';
import { getRepoFullname } from '../utils/gitUtils';
import { ActionTreeItem } from './ActionTreeItem';
import { IAzureResourceTreeItem } from './IAzureResourceTreeItem';
import { StepTreeItem } from './StepTreeItem';

export type JobLogEntry = { timestamp: string, line: string };

export class JobTreeItem extends AzureParentTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'azureStaticJob';
    public readonly contextValue: string = JobTreeItem.contextValue;
    public parent: ActionTreeItem;
    public data: ActionsGetJobForWorkflowRunResponseData;
    public jobsLog: JobLogEntry[];

    constructor(parent: ActionTreeItem, data: ActionsGetJobForWorkflowRunResponseData) {
        super(parent);
        this.data = data;
    }

    public get iconPath(): TreeItemIconPath {
        return getActionIconPath(this.data);
    }

    public get id(): string {
        return this.data.id.toString();
    }

    public get name(): string {
        return this.data.name || this.id;
    }

    public get label(): string {
        return this.name;
    }

    public get description(): string {
        return getActionDescription(this.data);
    }

    public get startedDate(): Date {
        return new Date(this.data.started_at);
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, _context: IActionContext): Promise<AzExtTreeItem[]> {
        return await this.createTreeItemsWithErrorHandling(
            this.data.steps,
            'invalidStepTreeItem',
            (step) => new StepTreeItem(this, step),
            step => step.name
        );
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async refreshImpl(context: IActionContext): Promise<void> {
        const { owner, name } = getRepoFullname(this.parent.parent.repositoryUrl);
        const octokitClient: Octokit = await createOctokitClient(context);
        this.data = <ActionsGetJobForWorkflowRunResponseData>(await octokitClient.actions.getJobForWorkflowRun({ job_id: this.data.id, owner: owner, repo: name })).data;
    }

    public compareChildrenImpl(ti1: StepTreeItem, ti2: StepTreeItem): number {
        return ti1.data.number - ti2.data.number;
    }

    public async getJobLogs(context: IActionContext): Promise<JobLogEntry[]> {
        if (!this.jobsLog) {
            const { owner, name } = getRepoFullname(this.parent.parent.repositoryUrl);
            const octokitClient: Octokit = await createOctokitClient(context);

            const rawLogData: JobLogsForWorkflowRun = (await octokitClient.actions.downloadJobLogsForWorkflowRun({ owner, repo: name, job_id: this.data.id, mediaType: { format: 'json' } })).data;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const logData: string[] = (<string>rawLogData).split('\r\n');
            this.jobsLog = logData.map((entry) => { return { timestamp: entry.substring(0, entry.indexOf(' ')), line: entry.substring(entry.indexOf(' ') + 1) } })

        }

        return this.jobsLog;
    }
}
