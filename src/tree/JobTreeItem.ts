/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtParentTreeItem, AzExtTreeItem, IActionContext, TreeItemIconPath } from "@microsoft/vscode-azext-utils";
import { Octokit } from '@octokit/rest';
import { createOctokitClient } from '../commands/github/createOctokitClient';
import { ActionsGetJobForWorkflowRunResponseData } from '../gitHubTypings';
import { getActionDescription, getActionIconPath } from '../utils/actionUtils';
import { getRepoFullname } from '../utils/gitUtils';
import { localize } from '../utils/localize';
import { ActionTreeItem } from './ActionTreeItem';
import { IAzureResourceTreeItem } from './IAzureResourceTreeItem';
import { StepTreeItem } from './StepTreeItem';

export class JobTreeItem extends AzExtParentTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'azureStaticJob';
    public readonly contextValue: string = JobTreeItem.contextValue;
    public parent!: ActionTreeItem;
    public childTypeLabel: string = localize('step', 'step');
    public data: ActionsGetJobForWorkflowRunResponseData;

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
            this.data.steps || [],
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

    public async getRawJobLog(context: IActionContext): Promise<string> {
        const { owner, name } = getRepoFullname(this.parent.parent.repositoryUrl);
        const octokitClient: Octokit = await createOctokitClient(context);
        return <string>(await octokitClient.actions.downloadJobLogsForWorkflowRun({ owner, repo: name, job_id: this.data.id, mediaType: { format: 'json' } })).data;
    }

    public isAncestorOfImpl(_contextValue: string | RegExp): boolean {
        return !!this.data.steps && this.data.steps.length > 0;
    }
}
