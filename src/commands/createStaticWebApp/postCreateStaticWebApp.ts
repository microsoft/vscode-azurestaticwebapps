/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit } from "@octokit/rest";
import { ActionsGetWorkflowResponseData } from "@octokit/types";
import { MessageItem, window } from "vscode";
import { callWithTelemetryAndErrorHandling, IActionContext, UserCancelledError } from "vscode-azureextensionui";
import { productionEnvironmentName, showActionsMsg } from "../../constants";
import { ext } from "../../extensionVariables";
import { Conclusion, Status } from "../../gitHubTypings";
import { ActionTreeItem } from "../../tree/ActionTreeItem";
import { EnvironmentTreeItem } from "../../tree/EnvironmentTreeItem";
import { StaticWebAppTreeItem } from "../../tree/StaticWebAppTreeItem";
import { delay } from "../../utils/delay";
import { getRepoFullname } from "../../utils/gitHubUtils";
import { localize } from "../../utils/localize";
import { nonNullValue } from "../../utils/nonNull";
import { openUrl } from "../../utils/openUrl";
import { browse } from "../browse";
import { checkActionStatus } from "../github/actionCommands";
import { createOctokitClient } from "../github/createOctokitClient";

export async function postCreateStaticWebApp(swaNode: StaticWebAppTreeItem): Promise<void> {
    return await callWithTelemetryAndErrorHandling('staticWebApps.postCreateStaticWebApp', async (context: IActionContext): Promise<void> => {
        const productionEnv: EnvironmentTreeItem | undefined = <EnvironmentTreeItem | undefined>(await swaNode.loadAllChildren(context)).find((ti) => { return ti instanceof EnvironmentTreeItem && ti.label === productionEnvironmentName; });
        if (productionEnv) {
            const octokitClient: Octokit = await createOctokitClient(context);
            const { owner, name } = getRepoFullname(productionEnv.repositoryUrl);
            let deployActionNode: ActionTreeItem | undefined;
            const maxTime: number = Date.now() + 30 * 1000; // it can take a little for the action to queue in GitHub, wait for 30 seconds

            while (!deployActionNode) {
                await productionEnv.actionsTreeItem.refresh(context);
                const actionTreeItems: ActionTreeItem[] = <ActionTreeItem[]>(await productionEnv.actionsTreeItem.loadAllChildren(context));
                const filteredTreeItems: ActionTreeItem[] = actionTreeItems.filter(ti => { return ti.data.status !== Status.Completed; }); // only looking at on-going or queued jobs

                const promises: Promise<void>[] = filteredTreeItems.map(async ti => {
                    const workflow: ActionsGetWorkflowResponseData = (await octokitClient.actions.getWorkflow({ owner, repo: name, workflow_id: ti.data.workflow_id })).data;
                    // example of defaultHostname: 'black-bay-07228711e.azurestaticapps.net'
                    // example of workflow path: '.github/workflows/azure-static-web-apps-black-bay-07228711e.yml'
                    // to verify the workflow matches the current default host, we need to remove the 'azurestaticapps.net' portions of the defaultHostname
                    if (workflow.path.includes(swaNode.defaultHostname.split('.')[0])) {
                        deployActionNode = ti;
                    }
                });

                // the map will create an array of promises that will get resolved in parallel here
                await Promise.all(promises);

                if (Date.now() > maxTime) {
                    throw new UserCancelledError();
                }
                await delay(1000);
            }

            const conclusion: Conclusion = await checkActionStatus(context, deployActionNode, true);

            // only output a message if it completed or failed
            const success: boolean = conclusion === Conclusion.Success;
            if (success || conclusion === Conclusion.Failure) {
                await productionEnv.refresh(context);
                const deploymentMsg: string = success ?
                    localize('deploymentCompleted', 'Successfully built and deployed "{0}". Commit and push changes the GitHub repository to create a new deployment.', swaNode.name) :
                    localize('deploymentFailed', 'Deployment for "{0}" has failed. Commit and push changes the GitHub repository to create a new deployment.', swaNode.name);
                ext.outputChannel.appendLog(deploymentMsg);
                const browseWebsite: MessageItem = { title: localize('browseWebsite', 'Browse Website') };
                const msgItem: MessageItem = success ? browseWebsite : showActionsMsg;
                window.showInformationMessage(deploymentMsg, msgItem).then(async input => {
                    if (input === browseWebsite) {
                        await browse(context, swaNode);
                    } else if (input === showActionsMsg) {
                        await openUrl(nonNullValue(deployActionNode).data.html_url);
                    }
                });
            }
        }
        return;
    });

}
