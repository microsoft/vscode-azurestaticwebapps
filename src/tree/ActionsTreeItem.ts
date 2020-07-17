/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IncomingMessage } from "ms-rest";
import { ThemeIcon } from "vscode";
import { AzExtTreeItem, AzureParentTreeItem, TreeItemIconPath } from "vscode-azureextensionui";
import { githubApiEndpoint } from "../constants";
import { createGitHubRequestOptions, getGitHubAccessToken, getRepoFullname, gitHubWebResource } from '../utils/gitHubUtils';
import { localize } from "../utils/localize";
import { requestUtils } from "../utils/requestUtils";
import { ActionTreeItem, GitHubAction } from './ActionTreeItem';
import { EnvironmentTreeItem } from "./EnvironmentTreeItem";

export class ActionsTreeItem extends AzureParentTreeItem {

    public static contextValue: string = 'azureStaticActions';
    public readonly contextValue: string = ActionsTreeItem.contextValue;
    public readonly childTypeLabel: string = localize('action', 'action');
    public parent: EnvironmentTreeItem;

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

    public async loadMoreChildrenImpl(_clearCache: boolean): Promise<AzExtTreeItem[]> {
        const { owner, name } = getRepoFullname(this.repositoryUrl);
        const branch: string = this.parent.data.properties.sourceBranch;

        const token: string = await getGitHubAccessToken();
        const requestOption: gitHubWebResource = await createGitHubRequestOptions(token, `${githubApiEndpoint}/repos/${owner}/${name}/actions/runs?branch=${branch}`);
        const githubResponse: IncomingMessage & { body: string } = await requestUtils.sendRequest(requestOption);

        const actions: { workflow_runs: GitHubAction[] } = <{ workflow_runs: GitHubAction[] }>JSON.parse(githubResponse.body);
        return await this.createTreeItemsWithErrorHandling(
            actions.workflow_runs,
            'invalidActionTreeItem',
            (act) => new ActionTreeItem(this, act),
            act => act.head_commit.message
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
