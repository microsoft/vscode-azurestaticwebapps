/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { IActionContext, registerEvent } from '@microsoft/vscode-azext-utils';
import * as vscode from 'vscode';
import { swa } from '../../constants';

interface IRunningSwaTask {
    processId: number;
}

const runningSwaTaskMap: Map<vscode.WorkspaceFolder | vscode.TaskScope, IRunningSwaTask> = new Map<vscode.WorkspaceFolder | vscode.TaskScope, IRunningSwaTask>();

export function registerSwaCliTaskEvents(): void {
    registerEvent('staticWebApps.onDidTerminateDebugSession', vscode.debug.onDidTerminateDebugSession, async (context: IActionContext, debugSession: vscode.DebugSession) => {
        context.errorHandling.suppressDisplay = true;
        context.telemetry.suppressIfSuccessful = true;
        if (!debugSession.parentSession && debugSession.workspaceFolder) {
            stopSwaTaskIfRunning(debugSession.workspaceFolder);
        }
    });

    registerEvent('staticWebApps.onDidStartTask', vscode.tasks.onDidStartTaskProcess, async (context: IActionContext, e: vscode.TaskProcessStartEvent) => {
        context.errorHandling.suppressDisplay = true;
        context.telemetry.suppressIfSuccessful = true;
        if (e.execution.task.scope !== undefined && isSwaCliTask(e.execution.task)) {
            runningSwaTaskMap.set(e.execution.task.scope, { processId: e.processId });
        }
    });
}

function isSwaCliTask(task: vscode.Task): boolean {
    return !!(task.source === swa && task.execution instanceof vscode.ShellExecution && task.execution?.command === swa)
}

function stopSwaTaskIfRunning(workspaceFolder: vscode.WorkspaceFolder): void {
    const runningFuncTask: IRunningSwaTask | undefined = runningSwaTaskMap.get(workspaceFolder);
    if (runningFuncTask !== undefined) {
        // Use `process.kill` because `TaskExecution.terminate` closes the terminal pane and erases all output
        process.kill(runningFuncTask.processId);
        runningSwaTaskMap.delete(workspaceFolder);
    }
}
