/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { MessageItem, window, workspace } from "vscode";
import { callWithTelemetryAndErrorHandling, IActionContext } from "vscode-azureextensionui";
import { cloneRepoMsg, showActionsMsg } from "../constants";
import { ext } from "../extensionVariables";
import { StaticWebAppTreeItem } from "../tree/StaticWebAppTreeItem";
import { localize } from "../utils/localize";
import { cloneRepo } from './github/cloneRepo';
import { showActions } from "./github/showActions";
import { openYAMLConfigFile } from "./openYAMLConfigFile";

export async function showSwaCreated(swaNode: StaticWebAppTreeItem): Promise<void> {
    return await callWithTelemetryAndErrorHandling('staticWebApps.showSwaCreated', async (context: IActionContext) => {
        const createdSs: string = localize('createdSs', 'Successfully created new static web app "{0}".  GitHub Actions is building and deploying your app, it will be available once the deployment completes.', swaNode.name);
        ext.outputChannel.appendLog(createdSs);

        const viewEditWorkflow: MessageItem = { title: localize('viewEditWorkflow', 'View/Edit Workflow') };

        const messageItems = [showActionsMsg, viewEditWorkflow];
        if (!workspace.workspaceFolders || workspace.workspaceFolders.length === 0) {
            messageItems.push(cloneRepoMsg)
        }
        await window.showInformationMessage(createdSs, ...messageItems).then(async (result) => {
            context.telemetry.properties.clicked = 'canceled';
            if (result === showActionsMsg) {
                await showActions(context, swaNode);
                context.telemetry.properties.clicked = 'showActions';
            } else if (result === viewEditWorkflow) {
                await openYAMLConfigFile(context, swaNode);
                context.telemetry.properties.clicked = 'openConfig';
            } else if (result === cloneRepoMsg) {
                context.telemetry.properties.clicked = 'cloneRepo';
                await cloneRepo(context, swaNode);
            }
        });
    });
}
