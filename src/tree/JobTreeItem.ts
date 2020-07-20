/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as moment from 'moment';
import { IncomingMessage } from 'ms-rest';
import { gitHubWebResource } from 'vscode-azureappservice/out/src/github/connectToGitHub';
import { requestUtils } from 'vscode-azureappservice/out/src/utils/requestUtils';
import { AzExtTreeItem, AzureParentTreeItem, IActionContext, TreeItemIconPath } from "vscode-azureextensionui";
import { Conclusion, Status } from '../constants';
import { convertConclusionToVerb, convertStatusToVerb, createGitHubRequestOptions, getGitHubAccessToken } from '../utils/gitHubUtils';
import { getTimeElapsedString } from '../utils/timeUtils';
import { treeUtils } from "../utils/treeUtils";
import { ActionTreeItem } from './ActionTreeItem';
import { IAzureResourceTreeItem } from './IAzureResourceTreeItem';
import { GitHubStep, StepTreeItem } from './StepTreeItem';

export type GitHubJob = {
    id: number;
    run_id: number;
    run_url: string;
    node_id: string;
    head_sha: string;
    url: string;
    html_url: string;
    status: Status;
    conclusion: Conclusion;
    started_at: Date;
    completed_at: Date;
    name: string;
    steps: GitHubStep[];
    check_run_url: string;
};

export class JobTreeItem extends AzureParentTreeItem implements IAzureResourceTreeItem {

    public static contextValue: string = 'azureStaticJob';
    public readonly contextValue: string = JobTreeItem.contextValue;
    public parent: ActionTreeItem;
    public data: GitHubJob;

    constructor(parent: ActionTreeItem, data: GitHubJob) {
        super(parent);
        this.data = data;
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getActionIconPath(this.data.status, this.data.conclusion);
    }

    public get id(): string {
        return `${this.parent.id}/${this.data.id}`;
    }

    public get name(): string {
        return this.data.name;
    }

    public get label(): string {
        return this.name;
    }

    public get description(): string {
        if (this.data.conclusion) {
            const elapsedTime: string = getTimeElapsedString(this.startedDate, this.completedDate);
            return `${convertConclusionToVerb(this.data.conclusion)} ${moment(this.completedDate).fromNow()} in ${elapsedTime}`;
        } else {
            return `${convertStatusToVerb(this.data.status)} ${moment(this.startedDate).fromNow()}`;
        }
    }

    private get startedDate(): Date {
        return new Date(this.data.started_at);
    }

    private get completedDate(): Date {
        return new Date(this.data.completed_at);
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, _context: IActionContext): Promise<AzExtTreeItem[]> {
        return this.data.steps.map((step => {
            return new StepTreeItem(this, step);
        }));
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async refreshImpl(): Promise<void> {
        const token: string = await getGitHubAccessToken();
        const gitHubRequest: gitHubWebResource = await createGitHubRequestOptions(token, this.data.url);
        const githubResponse: IncomingMessage & { body: string } = await requestUtils.sendRequest(gitHubRequest);
        this.data = <GitHubJob>JSON.parse(githubResponse.body);
    }

    public compareChildrenImpl(ti1: StepTreeItem, ti2: StepTreeItem): number {
        return ti1.data.number < ti2.data.number ? -1 : 1;
    }
}
