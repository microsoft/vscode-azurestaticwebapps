/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IncomingMessage } from 'ms-rest';
import * as path from 'path';
import { ext } from 'vscode-azureappservice/out/src/extensionVariables';
import { gitHubWebResource } from 'vscode-azureappservice/out/src/github/connectToGitHub';
import { requestUtils } from 'vscode-azureappservice/out/src/utils/requestUtils';
import { AzureTreeItem, TreeItemIconPath } from "vscode-azureextensionui";
import { IGitHubContext } from '../commands/github/IGitHubContext';
import { delay } from '../utils/delay';
import { createGitHubRequestOptions } from '../utils/gitHubUtils';
import { localize } from '../utils/localize';
import { treeUtils } from "../utils/treeUtils";
import { ActionsTreeItem } from "./ActionsTreeItem";

export type GitHubAction = {
    id: string; conclusion: 'success' | 'failure' | 'skip' | 'cancelled' | null;
    event: string;
    head_branch: string;
    status: 'queued' | 'in-progress';
    head_commit: { message: string };
    url: string;
    html_url: string;
    rerun_url: string;
    cancel_url: string;
};

export class ActionTreeItem extends AzureTreeItem {

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
        return `${this.parent.parent.id}/${this.data.id}`;
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
        const gitHubRequest: gitHubWebResource = await createGitHubRequestOptions(undefined, this.data.url);
        const githubResponse: IncomingMessage & { body: string } = await requestUtils.sendRequest(gitHubRequest);
        this.data = <GitHubAction>JSON.parse(githubResponse.body);
    }

    public async rerunAction(context: IGitHubContext): Promise<void> {
        const gitHubRequest: gitHubWebResource = await createGitHubRequestOptions(context, this.data.rerun_url, 'POST');
        const rerunRunning: string = localize('rerunRunning', 'Rerun for action "{0}" has started.', this.data.id);
        ext.outputChannel.appendLog(rerunRunning);

        await this.waitForJobToFinish(gitHubRequest);
        if (this.data.conclusion !== 'cancelled') {
            const rerunCompleted: string = localize('rerunCompleted', 'Rerun for action "{0}" has completed.', this.data.id);
            ext.outputChannel.appendLog(rerunCompleted);
        }
    }

    public async cancelAction(context: IGitHubContext): Promise<void> {
        const gitHubRequest: gitHubWebResource = await createGitHubRequestOptions(context, this.data.cancel_url, 'POST');
        const cancelRunning: string = localize('cancelRunning', 'Cancel for action "{0}" has started.', this.data.id);
        ext.outputChannel.appendLog(cancelRunning);

        await this.waitForJobToFinish(gitHubRequest);
        const cancelCompleted: string = localize('cancelCompleted', 'Cancel for action "{0}" has completed.', this.data.id);
        ext.outputChannel.appendLog(cancelCompleted);
    }

    private async waitForJobToFinish(gitHubRequest: gitHubWebResource): Promise<void> {
        await requestUtils.sendRequest(gitHubRequest);
        await this.refresh(); // need to refresh to update the data

        while (!this.data.conclusion) {
            await delay(2000);
            await this.refresh();
        }
    }
}
