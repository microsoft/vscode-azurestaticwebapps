/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit } from "@octokit/rest";
import { ActionsGetWorkflowRunResponseData } from "@octokit/types";
import * as retry from 'p-retry';
import { CancellationToken, CancellationTokenSource, window } from "vscode";
import { IActionContext, parseError, UserCancelledError } from "vscode-azureextensionui";
import { ext } from "../../extensionVariables";
import { ActionTreeItem } from "../../tree/ActionTreeItem";
import { ensureStatus } from "../../utils/actionUtils";
import { localize } from "../../utils/localize";
import { createOctokitClient } from "./createOctokitClient";

const activeActionTokens: { [key: string]: CancellationTokenSource | undefined } = {};

export async function rerunAction(context: IActionContext, node?: ActionTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<ActionTreeItem>(ActionTreeItem.contextValue, { ...context, suppressCreatePick: true });
    }

    const rerunRunning: string = localize('rerunRunning', 'Rerun for action "{0}" has started.', node.data.id);
    ext.outputChannel.appendLog(rerunRunning);

    const client: Octokit = await createOctokitClient();
    await client.actions.reRunWorkflow({ owner: node.data.repository.owner.login, repo: node.data.repository.name, run_id: node.data.id });
    await node.refresh(); // need to refresh to update the data
    await checkActionStatus(context, node, 'rerun');
}

export async function cancelAction(context: IActionContext, node?: ActionTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<ActionTreeItem>(ActionTreeItem.contextValue, { ...context, suppressCreatePick: true });
    }

    const cancelRunning: string = localize('cancelRunning', 'Cancel for action "{0}" has started.', node.data.id);
    ext.outputChannel.appendLog(cancelRunning);

    const client: Octokit = await createOctokitClient();
    await client.actions.cancelWorkflowRun({ owner: node.data.repository.owner.login, repo: node.data.repository.name, run_id: node.data.id });
    await node.refresh(); // need to refresh to update the data
    await checkActionStatus(context, node, 'cancel');
}

async function checkActionStatus(context: IActionContext, node: ActionTreeItem, action: 'rerun' | 'cancel'): Promise<void> {
    // realistically, we have no idea how long someone's build can take, but might as well keep retrying while VS Code is opened
    const tokenSource: CancellationTokenSource = new CancellationTokenSource();
    const token: CancellationToken = tokenSource.token;
    if (activeActionTokens[node.data.id]) {
        activeActionTokens[node.data.id]?.cancel();
    }

    activeActionTokens[node.data.id] = tokenSource;

    const retries: number = 10;
    const startTime: number = Date.now();
    const notCompleteError: string = localize('notComplete', 'Action "{0}" has not completed.', node.data.id);
    const cancelled: string = 'Action cancelled by user';
    try {
        await retry(
            async () => {
                if (token?.isCancellationRequested) {
                    throw new retry.AbortError(cancelled);
                }

                const client: Octokit = await createOctokitClient();
                const workflowRun: ActionsGetWorkflowRunResponseData = (await client.actions.getWorkflowRun({ owner: node.data.repository.owner.login, repo: node.data.repository.name, run_id: node.data.id })).data;
                if (ensureStatus(workflowRun) === 'completed') {
                    const actionCompleted: string = localize('actionCompleted', 'Action "{0}" has completed with the conclusion "{1}".', node.data.id, workflowRun.conclusion);
                    ext.outputChannel.appendLog(actionCompleted);
                    window.showInformationMessage(actionCompleted);
                    await node.refresh();
                    context.telemetry.properties.secToReport = String((Date.now() - startTime) / 1000);
                    context.telemetry.properties.conclusion = workflowRun.conclusion;
                    context.telemetry.properties.action = action;
                    return;
                }

                throw new Error(notCompleteError);
            },
            {
                onFailedAttempt: error => {
                    if (parseError(error).message !== notCompleteError) {
                        throw error;
                    }
                },
                retries, minTimeout: 5 * 1000,
            });
    } catch (error) {
        if (parseError(error).message === cancelled) {
            throw new UserCancelledError();
        }

        throw error;
    } finally {
        activeActionTokens[node.data.id] = undefined;
        tokenSource.dispose();
    }

}
