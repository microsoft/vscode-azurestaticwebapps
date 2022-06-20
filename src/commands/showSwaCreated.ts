/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { callWithTelemetryAndErrorHandling, IActionContext } from "@microsoft/vscode-azext-utils";
import { MessageItem, window } from "vscode";
import { showActionsMsg } from "../constants";
import { ext } from "../extensionVariables";
import { ResolvedStaticWebApp } from "../StaticWebAppResolver";
import { localize } from "../utils/localize";
import { showActions } from "./github/showActions";
import { openYAMLConfigFile } from "./openYAMLConfigFile";

export async function showSwaCreated(swaNode: ResolvedStaticWebApp): Promise<void> {
    return await callWithTelemetryAndErrorHandling('staticWebApps.showSwaCreated', async (context: IActionContext) => {
        const createdSs: string = localize('createdSs', 'Successfully created new static web app "{0}".  GitHub Actions is building and deploying your app, it will be available once the deployment completes.', swaNode.name);
        ext.outputChannel.appendLog(createdSs);

        const viewEditWorkflow: MessageItem = { title: localize('viewEditWorkflow', 'View/Edit Workflow') };
        await window.showInformationMessage(createdSs, showActionsMsg, viewEditWorkflow).then(async (result) => {
            context.telemetry.properties.clicked = 'canceled';
            if (result === showActionsMsg) {
                await showActions(context, swaNode);
                context.telemetry.properties.clicked = 'showActions';
            } else if (result === viewEditWorkflow) {
                await openYAMLConfigFile(context, swaNode);
                context.telemetry.properties.clicked = 'openConfig';
            }
        });
    });
}
