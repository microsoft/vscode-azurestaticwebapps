/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext, nonNullProp, nonNullValue } from "@microsoft/vscode-azext-utils";
import { Octokit } from "@octokit/rest";
import { window } from "vscode";
import { swaFilter } from "../../constants";
import { ext } from "../../extensionVariables";
import { ActionsGetWorkflowRunResponseData, Conclusion, Status } from "../../gitHubTypings";
import { ActionTreeItem } from "../../tree/ActionTreeItem";
import { ensureConclusion, ensureStatus } from "../../utils/actionUtils";
import { pollAsyncOperation } from "../../utils/azureUtils";
import { localize } from "../../utils/localize";
import { createOctokitClient } from "./createOctokitClient";

export async function rerunAction(context: IActionContext, node?: ActionTreeItem): Promise<void> {
    const noItemFoundErrorMessage: string = localize('noCompleted', 'No completed actions found.');
    if (!node) {
        node = await ext.rgApi.pickAppResource<ActionTreeItem>({ ...context, suppressCreatePick: true, noItemFoundErrorMessage }, {
            filter: swaFilter,
            expectedChildContextValue: ActionTreeItem.contextValueCompleted
        });
    }

    const rerunRunning: string = localize('rerunRunning', 'Rerun for action "{0}" has started.', node.data.id);
    ext.outputChannel.appendLog(rerunRunning);

    const client: Octokit = await createOctokitClient(context);
    const owner = nonNullProp(node.data.repository, 'owner');
    await client.actions.reRunWorkflow({ owner: owner.login, repo: node.data.repository.name, run_id: node.data.id });
    await node.refresh(context); // need to refresh to update the data
    await checkActionStatus(context, node);
}

export async function cancelAction(context: IActionContext, node?: ActionTreeItem): Promise<void> {
    const noItemFoundErrorMessage: string = localize('noInProgress', 'No in-progress actions found.');
    if (!node) {
        node = await ext.rgApi.pickAppResource<ActionTreeItem>({ ...context, suppressCreatePick: true, noItemFoundErrorMessage }, {
            filter: swaFilter,
            expectedChildContextValue: ActionTreeItem.contextValueInProgress
        });
    }

    const cancelRunning: string = localize('cancelRunning', 'Cancel for action "{0}" has started.', node.data.id);
    ext.outputChannel.appendLog(cancelRunning);

    const client: Octokit = await createOctokitClient(context);
    const owner = nonNullProp(node.data.repository, 'owner');
    await client.actions.cancelWorkflowRun({ owner: owner.login, repo: node.data.repository.name, run_id: node.data.id });
    await node.refresh(context); // need to refresh to update the data
    await checkActionStatus(context, node);
}

export async function checkActionStatus(context: IActionContext, node: ActionTreeItem, initialCreate: boolean = false): Promise<Conclusion> {
    const startTime: number = Date.now();
    const client: Octokit = await createOctokitClient(context);
    let workflowRun: ActionsGetWorkflowRunResponseData | undefined;
    const owner = nonNullProp(node.data.repository, 'owner');

    const pollingOperation: () => Promise<boolean> = async () => {

        workflowRun = (await client.actions.getWorkflowRun({ owner: owner.login, repo: node.data.repository.name, run_id: node.data.id })).data;
        if (ensureStatus(workflowRun) === Status.Completed) {
            if (!initialCreate) {
                const actionCompleted: string = localize('actionCompleted', 'Action "{0}" has completed with the conclusion "{1}".', node.data.id, workflowRun.conclusion);
                ext.outputChannel.appendLog(actionCompleted);
                void window.showInformationMessage(actionCompleted);
            }

            await node.refresh(context);
            context.telemetry.properties.secToReport = String((Date.now() - startTime) / 1000);
            context.telemetry.properties.conclusion = workflowRun.conclusion || '';
            return true;
        }

        return false;
    };

    if (!await pollAsyncOperation(pollingOperation, 15, 20 * 60, node.fullId)) {
        const operationTimedOut: string = localize('timedOut', 'The action "{0}" is still running.  Check "{1}" for its status', node.data.id, node.data.html_url);
        ext.outputChannel.appendLog(operationTimedOut);
        void window.showInformationMessage(operationTimedOut);
    }

    // this will get set in the awaited pollingOperation, but ts thinks it's unassigned
    return ensureConclusion(nonNullValue(workflowRun));
}
