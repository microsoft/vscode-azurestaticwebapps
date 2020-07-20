/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IncomingMessage } from 'ms-rest';
import { AzExtTreeItem, AzureParentTreeItem, IActionContext, TreeItemIconPath } from "vscode-azureextensionui";
import { Conclusion, githubApiEndpoint, Status } from '../constants';
import { createGitHubRequestOptions, getGitHubAccessToken, getRepoFullname, gitHubWebResource } from '../utils/gitHubUtils';
import { requestUtils } from '../utils/requestUtils';
import { treeUtils } from "../utils/treeUtils";
import { ActionsTreeItem } from "./ActionsTreeItem";
import { IAzureResourceTreeItem } from './IAzureResourceTreeItem';
import { GitHubJob, JobTreeItem } from './JobTreeItem';

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

export class ActionTreeItem extends AzureParentTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'azureStaticAction';
    public readonly contextValue: string = ActionTreeItem.contextValue;
    public parent: ActionsTreeItem;
    public data: GitHubAction;

    constructor(parent: ActionsTreeItem, data: GitHubAction) {
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
        const token: string = await getGitHubAccessToken();
        const requestOption: gitHubWebResource = await createGitHubRequestOptions(token, `${githubApiEndpoint}/repos/${owner}/${name}/actions/runs/${this.data.id}/jobs`);
        const githubResponse: IncomingMessage & { body: string } = await requestUtils.sendRequest(requestOption);
        const gitHubJobs: { jobs: GitHubJob[] } = <{ jobs: GitHubJob[] }>JSON.parse(githubResponse.body);
        return gitHubJobs.jobs.map((job => {
            return new JobTreeItem(this, job);
        }));
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async refreshImpl(): Promise<void> {
        const token: string = await getGitHubAccessToken();
        const gitHubRequest: gitHubWebResource = await createGitHubRequestOptions(token, this.data.url);
        const githubResponse: IncomingMessage & { body: string } = await requestUtils.sendRequest(gitHubRequest);
        this.data = <GitHubAction>JSON.parse(githubResponse.body);
    }
}
