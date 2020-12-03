/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit } from "@octokit/rest";
import { ActionsGetWorkflowRunResponseData } from "@octokit/types";
import { window } from "vscode";
import { IActionContext } from "vscode-azureextensionui";
import { ext } from "../../extensionVariables";
import { Conclusion, Status } from "../../gitHubTypings";
import { ActionTreeItem } from "../../tree/ActionTreeItem";
import { ensureConclusion, ensureStatus } from "../../utils/actionUtils";
import { pollAsyncOperation } from "../../utils/azureUtils";
import { localize } from "../../utils/localize";
import { nonNullValue } from "../../utils/nonNull";
import { createOctokitClient } from "./createOctokitClient";

export async function rerunAction(context: IActionContext, node?: ActionTreeItem): Promise<void> {
    const noItemFoundErrorMessage: string = localize('noCompleted', 'No completed actions found.');
    if (!node) {
        node = await ext.tree.showTreeItemPicker<ActionTreeItem>(ActionTreeItem.contextValueCompleted, { ...context, suppressCreatePick: true, noItemFoundErrorMessage });
    }

    const rerunRunning: string = localize('rerunRunning', 'Rerun for action "{0}" has started.', node.data.id);
    ext.outputChannel.appendLog(rerunRunning);

    const client: Octokit = await createOctokitClient(context);
    await client.actions.reRunWorkflow({ owner: node.data.repository.owner.login, repo: node.data.repository.name, run_id: node.data.id });
    await node.refresh(context); // need to refresh to update the data
    await checkActionStatus(context, node);
}

export async function cancelAction(context: IActionContext, node?: ActionTreeItem): Promise<void> {
    const noItemFoundErrorMessage: string = localize('noInProgress', 'No in-progress actions found.');
    if (!node) {
        node = await ext.tree.showTreeItemPicker<ActionTreeItem>(ActionTreeItem.contextValueInProgress, { ...context, suppressCreatePick: true, noItemFoundErrorMessage });
    }

    const cancelRunning: string = localize('cancelRunning', 'Cancel for action "{0}" has started.', node.data.id);
    ext.outputChannel.appendLog(cancelRunning);

    const client: Octokit = await createOctokitClient(context);
    await client.actions.cancelWorkflowRun({ owner: node.data.repository.owner.login, repo: node.data.repository.name, run_id: node.data.id });
    await node.refresh(context); // need to refresh to update the data
    await checkActionStatus(context, node);
}

export async function checkActionStatus(context: IActionContext, node: ActionTreeItem, initialCreate: boolean = false): Promise<Conclusion> {
    const startTime: number = Date.now();
    const client: Octokit = await createOctokitClient(context);
    let workflowRun: ActionsGetWorkflowRunResponseData | undefined;

    const pollingOperation: () => Promise<boolean> = async () => {
        workflowRun = (await client.actions.getWorkflowRun({ owner: node.data.repository.owner.login, repo: node.data.repository.name, run_id: node.data.id })).data;
        if (ensureStatus(workflowRun) === Status.Completed) {
            const actionCompleted: string = localize('actionCompleted', 'Action "{0}" has completed with the conclusion "{1}".', node.data.id, workflowRun.conclusion);
            if (!initialCreate) {
                ext.outputChannel.appendLog(actionCompleted);
                window.showInformationMessage(actionCompleted);
            }

            await node.refresh(context);
            context.telemetry.properties.secToReport = String((Date.now() - startTime) / 1000);
            context.telemetry.properties.conclusion = workflowRun.conclusion;
            return true;
        }

        return false;
    };

    if (!await pollAsyncOperation(pollingOperation, 15, 20 * 60, node.fullId)) {
        const operationTimedOut: string = localize('timedOut', 'The action "{0}" is still running.  Check "{1}" for its status', node.data.id, node.data.html_url);
        ext.outputChannel.appendLog(operationTimedOut);
        window.showInformationMessage(operationTimedOut);
    }

    // this will get set in the awaited pollingOperation, but ts thinks it's unassigned
    return ensureConclusion(nonNullValue(workflowRun));
}
