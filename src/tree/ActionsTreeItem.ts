/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtParentTreeItem, AzExtTreeItem, IActionContext, TreeItemIconPath } from "@microsoft/vscode-azext-utils";
import { Octokit } from "@octokit/rest";
import { OctokitResponse } from "@octokit/types";
import { ThemeIcon } from "vscode";
import { createOctokitClient } from "../commands/github/createOctokitClient";
import { ActionsListWorkflowRunsForRepoResponseData } from "../gitHubTypings";
import { getRepoFullname } from '../utils/gitUtils';
import { localize } from "../utils/localize";
import { ActionTreeItem } from './ActionTreeItem';
import { EnvironmentTreeItem } from "./EnvironmentTreeItem";

export class ActionsTreeItem extends AzExtParentTreeItem {

    public static contextValue: string = 'azureStaticActions';
    public readonly contextValue: string = ActionsTreeItem.contextValue;
    public readonly childTypeLabel: string = localize('action', 'action');
    public parent!: EnvironmentTreeItem;

    constructor(parent: EnvironmentTreeItem) {
        super(parent);
    }

    public get id(): string {
        return 'actionsList';
    }

    public get label(): string {
        return 'Actions';
    }

    public get iconPath(): TreeItemIconPath {
        return new ThemeIcon('github-inverted');
    }

    public get repositoryUrl(): string {
        return this.parent.parent.repositoryUrl;
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        const { owner, name } = getRepoFullname(this.repositoryUrl);
        const branch: string = this.parent.branch;

        const octokitClient: Octokit = await createOctokitClient(context);
        const response: OctokitResponse<ActionsListWorkflowRunsForRepoResponseData> = await octokitClient.actions.listWorkflowRunsForRepo({ owner: owner, repo: name });
        const runs = response.data.workflow_runs.filter(run => run.head_branch === branch);

        return await this.createTreeItemsWithErrorHandling(
            runs,
            'invalidActionTreeItem',
            (act) => new ActionTreeItem(this, act),
            act => act.head_commit?.message
        );
    }

    public compareChildrenImpl(_ti1: ActionTreeItem, _ti2: ActionTreeItem): number {
        // the GitHub API returns the actions in ascending creation order so we can just return 0 to maintain that order
        return 0;
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }
}
