/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IncomingMessage } from 'ms-rest';
import * as path from 'path';
import { AzureTreeItem, TreeItemIconPath } from "vscode-azureextensionui";
import { createGitHubRequestOptions, getGitHubAccessToken, gitHubWebResource } from '../utils/gitHubUtils';
import { requestUtils } from '../utils/requestUtils';
import { treeUtils } from "../utils/treeUtils";
import { ActionsTreeItem } from "./ActionsTreeItem";
import { IAzureResourceTreeItem } from './IAzureResourceTreeItem';

export type GitHubAction = {
    id: string;
    conclusion: 'success' | 'failure' | 'skip' | 'cancelled' | null;
    event: string;
    head_branch: string;
    status: 'queued' | 'in-progress';
    head_commit: { message: string };
    url: string;
    html_url: string;
    rerun_url: string;
    cancel_url: string;
};

export class ActionTreeItem extends AzureTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'azureStaticAction';
    public readonly contextValue: string = ActionTreeItem.contextValue;
    public parent: ActionsTreeItem;
    public data: GitHubAction;

    constructor(parent: ActionsTreeItem, data: GitHubAction) {
        super(parent);
        this.data = data;
    }

    public get iconPath(): TreeItemIconPath {
        return this.data.conclusion ? treeUtils.getThemedIconPath(path.join('conclusions', this.data.conclusion)) : treeUtils.getThemedIconPath(path.join('statuses', this.data.status));
    }

    public get id(): string {
        return this.data.id;
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

    public async refreshImpl(): Promise<void> {
        const token: string = await getGitHubAccessToken();
        const gitHubRequest: gitHubWebResource = await createGitHubRequestOptions(token, this.data.url);
        const githubResponse: IncomingMessage & { body: string } = await requestUtils.sendRequest(gitHubRequest);
        this.data = <GitHubAction>JSON.parse(githubResponse.body);
    }
}
