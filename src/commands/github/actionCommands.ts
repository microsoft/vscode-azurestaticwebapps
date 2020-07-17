/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext } from "vscode-azureextensionui";
import { ext } from "../../extensionVariables";
import { ActionTreeItem } from "../../tree/ActionTreeItem";
import { createGitHubRequestOptions, getGitHubAccessToken, gitHubWebResource } from "../../utils/gitHubUtils";
import { localize } from "../../utils/localize";
import { requestUtils } from "../../utils/requestUtils";

export async function rerunAction(context: IActionContext, node?: ActionTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<ActionTreeItem>(ActionTreeItem.contextValue, context);
    }

    const token: string = await getGitHubAccessToken();
    const gitHubRequest: gitHubWebResource = await createGitHubRequestOptions(token, node.data.rerun_url, 'POST');
    const rerunRunning: string = localize('rerunRunning', 'Rerun for action "{0}" has started.', node.data.id);
    ext.outputChannel.appendLog(rerunRunning);

    await requestUtils.sendRequest(gitHubRequest);
    await node.refresh(); // need to refresh to update the data
}

export async function cancelAction(context: IActionContext, node?: ActionTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<ActionTreeItem>(ActionTreeItem.contextValue, context);
    }

    const token: string = await getGitHubAccessToken();
    const gitHubRequest: gitHubWebResource = await createGitHubRequestOptions(token, node.data.cancel_url, 'POST');
    const cancelRunning: string = localize('cancelRunning', 'Cancel for action "{0}" has started.', node.data.id);
    ext.outputChannel.appendLog(cancelRunning);

    await requestUtils.sendRequest(gitHubRequest);
    await node.refresh(); // need to refresh to update the data
}
