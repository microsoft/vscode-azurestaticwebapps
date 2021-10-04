/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { IActionContext, registerEvent } from 'vscode-azureextensionui';

export function registerSwaCliTaskEvents(): void {
    registerEvent('azureStaticWebApps.onDidTerminateDebugSession', vscode.debug.onDidTerminateDebugSession, async (context: IActionContext, debugSession: vscode.DebugSession) => {
        context.errorHandling.suppressDisplay = true;
        context.telemetry.suppressIfSuccessful = true;
        if (await isSwaCliTaskExecution(debugSession.configuration.preLaunchTask)) {
            const taskExecution = vscode.tasks.taskExecutions.find((te) => te.task.name === debugSession.configuration.preLaunchTask);
            taskExecution?.terminate();
        }
    });
}

export function isSwaCliTask(task: vscode.Task): boolean {
    return !!(task.execution instanceof vscode.ShellExecution && task.execution?.commandLine?.match(/^swa start/))
}

async function isSwaCliTaskExecution(label: string): Promise<boolean> {
    const taskExecutions: readonly vscode.TaskExecution[] = vscode.tasks.taskExecutions;
    return !!taskExecutions.some((te) => (te.task.name === label && isSwaCliTask(te.task)));
}
