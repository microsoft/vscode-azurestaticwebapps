/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as moment from 'moment';
import { IncomingMessage } from 'ms-rest';
import * as prettyMs from 'pretty-ms';
import { gitHubWebResource } from 'vscode-azureappservice/out/src/github/connectToGitHub';
import { requestUtils } from 'vscode-azureappservice/out/src/utils/requestUtils';
import { AzExtTreeItem, AzureParentTreeItem, IActionContext, TreeItemIconPath } from "vscode-azureextensionui";
import { convertConclusionToVerb, convertStatusToVerb, createGitHubRequestOptions, getGitHubAccessToken } from '../utils/gitHubUtils';
import { treeUtils } from "../utils/treeUtils";
import { ActionTreeItem, GitHubJob } from './ActionTreeItem';
import { IAzureResourceTreeItem } from './IAzureResourceTreeItem';
import { StepTreeItem } from './StepTreeItem';

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
            const elapsedMs: number = this.completedDate.getTime() - this.startedDate.getTime();
            return `${convertConclusionToVerb(this.data.conclusion)} ${moment(this.completedDate).fromNow()} in ${prettyMs(elapsedMs)}`;
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
        const token: string = await getGitHubAccessToken();
        const gitHubRequest: gitHubWebResource = await createGitHubRequestOptions(token, this.data.url);
        const githubResponse: IncomingMessage & { body: string } = await requestUtils.sendRequest(gitHubRequest);
        this.data = <GitHubJob>JSON.parse(githubResponse.body);
    }

    public compareChildrenImpl(ti1: StepTreeItem, ti2: StepTreeItem): number {
        return ti1.data.number < ti2.data.number ? -1 : 1;
    }
}
