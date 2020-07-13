/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IncomingMessage } from "ms-rest";
import { ThemeIcon } from "vscode";
import { AzExtTreeItem, AzureParentTreeItem, TreeItemIconPath } from "vscode-azureextensionui";
import { IGitHubContext } from "../commands/github/IGitHubContext";
import { githubApiEndpoint } from "../constants";
import { createGitHubRequestOptions, getRepoFullname, gitHubWebResource } from '../utils/gitHubUtils';
import { requestUtils } from "../utils/requestUtils";
import { ActionTreeItem, GitHubAction } from './ActionTreeItem';
import { EnvironmentTreeItem } from "./EnvironmentTreeItem";

export class ActionsTreeItem extends AzureParentTreeItem {

    public static contextValue: string = 'azureStaticActions';
    public readonly contextValue: string = ActionsTreeItem.contextValue;
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

    public async loadMoreChildrenImpl(_clearCache: boolean, context: IGitHubContext): Promise<AzExtTreeItem[]> {
        const { owner, name } = getRepoFullname(this.repositoryUrl);
        const branch: string = this.parent.data.properties.sourceBranch;
        const requestOption: gitHubWebResource = await createGitHubRequestOptions(context, `${githubApiEndpoint}/repos/${owner}/${name}/actions/runs?branch=${branch}`);
        const githubResponse: IncomingMessage & { body: string } = await requestUtils.sendRequest(requestOption);
        const actions: { workflow_runs: GitHubAction[] } = <{ workflow_runs: GitHubAction[] }>JSON.parse(githubResponse.body);
        return actions.workflow_runs.map((act => {
            return new ActionTreeItem(this, act);
        }));
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }
}
