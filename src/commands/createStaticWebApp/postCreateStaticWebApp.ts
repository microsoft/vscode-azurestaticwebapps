/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit } from "@octokit/rest";
import { ActionsGetWorkflowResponseData } from "@octokit/types";
import { MessageItem, window } from "vscode";
import { IActionContext } from "vscode-azureextensionui";
import { productionEnvironmentName, showActionsMsg } from "../../constants";
import { ext } from "../../extensionVariables";
import { Conclusion } from "../../gitHubTypings";
import { ActionTreeItem } from "../../tree/ActionTreeItem";
import { EnvironmentTreeItem } from "../../tree/EnvironmentTreeItem";
import { StaticWebAppTreeItem } from "../../tree/StaticWebAppTreeItem";
import { getRepoFullname } from "../../utils/gitHubUtils";
import { localize } from "../../utils/localize";
import { openUrl } from "../../utils/openUrl";
import { browse } from "../browse";
import { checkActionStatus } from "../github/actionCommands";
import { createOctokitClient } from "../github/createOctokitClient";

export async function postCreateStaticWebApp(context: IActionContext, swaNode: StaticWebAppTreeItem): Promise<undefined> {
    const productionEnv: EnvironmentTreeItem | undefined = <EnvironmentTreeItem | undefined>(await swaNode.loadAllChildren(context)).find((ti) => { return ti instanceof EnvironmentTreeItem && ti.label === productionEnvironmentName; });
    if (productionEnv) {
        const actions: ActionTreeItem[] = <ActionTreeItem[]>(await productionEnv.actionsTreeItem.loadAllChildren(context));
        const octokitClient: Octokit = await createOctokitClient();
        const { owner, name } = getRepoFullname(productionEnv.repositoryUrl);
        const deployActionNode: ActionTreeItem | undefined = actions.find(async (ti) => {
            const workflow: ActionsGetWorkflowResponseData = (await octokitClient.actions.getWorkflow({ owner, repo: name, workflow_id: ti.data.id })).data;
            return workflow.path.includes(swaNode.defaultHostname);
        });

        if (!deployActionNode) {
            return undefined;
        }
        await productionEnv.refresh();
        const conclusion: Conclusion = await checkActionStatus(context, deployActionNode);

        // only output a message if it completed or failed
        const success: boolean = conclusion === Conclusion.Success;
        if (success || conclusion === Conclusion.Failure) {
            const deploymentMsg: string = success ?
                localize('deploymentCompleted', 'Successfully built and deployed "{0}". Commit and push changes the GitHub repository to create a new deployment.', swaNode.name) :
                localize('deploymentFailed', 'Deployment for "{0}" has failed. Commit and push changes the GitHub repository to create a new deployment.', swaNode.name);
            ext.outputChannel.appendLog(deploymentMsg);
            const browseWebsite: MessageItem = { title: localize('browseWebsite', 'Browse Website') };
            const msgItem: MessageItem = success ? browseWebsite : showActionsMsg;
            const input: MessageItem | undefined = await window.showInformationMessage(deploymentMsg, msgItem);
            if (input === browseWebsite) {
                await browse(context, swaNode);
            } else if (input === showActionsMsg) {
                await openUrl(deployActionNode.data.html_url);
            }

            await swaNode.refresh();
        }
    }

    return;

}
