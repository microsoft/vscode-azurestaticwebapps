/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { MessageItem, window } from "vscode";
import { IActionContext } from "vscode-azureextensionui";
import { productionEnvironmentName, showActionsMsg } from "../../constants";
import { ext } from "../../extensionVariables";
import { EnvironmentTreeItem } from "../../tree/EnvironmentTreeItem";
import { StaticWebAppTreeItem } from "../../tree/StaticWebAppTreeItem";
import { pollAsyncOperation } from "../../utils/azureUtils";
import { localize } from "../../utils/localize";
import { browse } from "../browse";
import { showActions } from "../github/showActions";

export async function postCreateStaticWebApp(context: IActionContext, swaNode: StaticWebAppTreeItem): Promise<undefined> {
    const productionEnv: EnvironmentTreeItem | undefined = <EnvironmentTreeItem | undefined>(await swaNode.loadAllChildren(context)).find((ti) => { return ti instanceof EnvironmentTreeItem && ti.label === productionEnvironmentName; });
    if (productionEnv) {
        const pollingOperation: () => Promise<boolean> = async () => {
            await productionEnv.refresh();
            return productionEnv.data.status === 'Ready' || productionEnv.data.status === 'Failed';
        };

        // only output a message if it completed or failed
        if (await pollAsyncOperation(pollingOperation, 10, 5 * 60, swaNode.fullId)) {
            const ready: boolean = productionEnv.data.status === 'Ready';
            const deploymentMsg: string = ready ?
                localize('deploymentCompleted', 'Successfully built and deployed "{0}". Commit and push changes the GitHub repository to create a new deployment.', swaNode.name) :
                localize('deploymentFailed', 'Deployment for "{0}" has failed. Commit and push changes the GitHub repository to create a new deployment.', swaNode.name);
            ext.outputChannel.appendLog(deploymentMsg);
            const browseWebsite: MessageItem = { title: localize('browseWebsite', 'Browse Website') };
            const msgItem: MessageItem = ready ? browseWebsite : showActionsMsg;
            const input: MessageItem | undefined = await window.showInformationMessage(deploymentMsg, msgItem);
            if (input === browseWebsite) {
                await browse(context, swaNode);
            } else if (input === showActionsMsg) {
                await showActions(context, swaNode);
            }
        }
    }

    return;

}
