/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { IActionContext, registerEvent } from 'vscode-azureextensionui';
import { swaTaskLabel } from '../../constants';
import { terminateSwaTasks } from '../../debug/StaticWebAppDebugProvider';

export function registerSwaCliTaskEvents(): void {
    registerEvent('azureStaticWebApps.onDidTerminateDebugSession', vscode.debug.onDidTerminateDebugSession, (context: IActionContext, debugSession: vscode.DebugSession) => {
        context.errorHandling.suppressDisplay = true;
        context.telemetry.suppressIfSuccessful = true;

        if (debugSession.configuration.preLaunchTask === swaTaskLabel) {
            terminateSwaTasks();
        }
    });
}
