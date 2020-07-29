/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit } from '@octokit/rest';
import { ActionsGetJobForWorkflowRunResponseData } from '@octokit/types';
import * as moment from 'moment';
import { AzExtTreeItem, AzureParentTreeItem, IActionContext, TreeItemIconPath } from "vscode-azureextensionui";
import { createOctokitClient } from '../commands/github/createOctokitClient';
import { Conclusion, Status } from '../gitHubTypings';
import { convertConclusionToVerb, convertStatusToVerb, ensureConclusion, ensureStatus } from '../utils/actionUtils';
import { getRepoFullname } from '../utils/gitHubUtils';
import { localize } from '../utils/localize';
import { treeUtils } from "../utils/treeUtils";
import { ActionTreeItem } from './ActionTreeItem';
import { IAzureResourceTreeItem } from './IAzureResourceTreeItem';
import { StepTreeItem } from './StepTreeItem';

export class JobTreeItem extends AzureParentTreeItem implements IAzureResourceTreeItem {

    public static contextValue: string = 'azureStaticJob';
    public readonly contextValue: string = JobTreeItem.contextValue;
    public parent: ActionTreeItem;
    public data: ActionsGetJobForWorkflowRunResponseData;

    constructor(parent: ActionTreeItem, data: ActionsGetJobForWorkflowRunResponseData) {
        super(parent);
        this.data = data;
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getActionIconPath(this._status, this._conclusion);
    }

    public get id(): string {
        return this.data.id.toString();
    }

    public get name(): string {
        return this.data.name;
    }

    public get label(): string {
        return this.name;
    }

    public get description(): string {
        if (this.data.conclusion !== null) {
            return localize('conclusionDescription', '{0} {1}', convertConclusionToVerb(this._conclusion), moment(this._completedDate).fromNow());
        } else {
            return localize('statusDescription', '{0} {1}', convertStatusToVerb(this._status), moment(this.startedDate).fromNow());
        }
    }

    public get startedDate(): Date {
        return new Date(this.data.started_at);
    }

    private get _completedDate(): Date {
        return new Date(this.data.completed_at);
    }

    private get _status(): Status {
        return ensureStatus(this.data.status);
    }

    private get _conclusion(): Conclusion {
        return ensureConclusion(this.data.conclusion);
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

    public async refreshImpl(): Promise<void> {
        const { owner, name } = getRepoFullname(this.parent.parent.repositoryUrl);
        const octokitClient: Octokit = await createOctokitClient();
        this.data = (await octokitClient.actions.getJobForWorkflowRun({ job_id: this.data.id, owner: owner, repo: name })).data;
    }

    public compareChildrenImpl(ti1: StepTreeItem, ti2: StepTreeItem): number {
        return ti1.data.number - ti2.data.number;
    }
}
