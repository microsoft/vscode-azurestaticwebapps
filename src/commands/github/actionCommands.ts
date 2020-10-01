/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit } from "@octokit/rest";
import { IActionContext } from "vscode-azureextensionui";
import { ext } from "../../extensionVariables";
import { ActionTreeItem } from "../../tree/ActionTreeItem";
import { localize } from "../../utils/localize";
import { createOctokitClient } from "./createOctokitClient";

export async function rerunAction(context: IActionContext, node?: ActionTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<ActionTreeItem>(ActionTreeItem.contextValue, { ...context, suppressCreatePick: true });
    }

    const rerunRunning: string = localize('rerunRunning', 'Rerun for action "{0}" has started.', node.data.id);
    ext.outputChannel.appendLog(rerunRunning);

    const client: Octokit = await createOctokitClient();
    await client.actions.reRunWorkflow({ owner: node.data.repository.owner.login, repo: node.data.repository.name, run_id: node.data.id });
    await node.refresh(); // need to refresh to update the data
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
}
