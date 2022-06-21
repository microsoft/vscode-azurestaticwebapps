/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ShellExecution, ShellExecutionOptions, Task, TaskDefinition, workspace, WorkspaceConfiguration, WorkspaceFolder } from "vscode";
import { shell, swa, swaWatchProblemMatcher } from "../constants";

const tasksKey: string = 'tasks';
const versionKey: string = 'version';

export function getTasks(folder: WorkspaceFolder): ITask[] {
    return getTasksConfig(folder).get<ITask[]>(tasksKey) || [];
}

export async function updateTasks(folder: WorkspaceFolder, tasks: ITask[]): Promise<void> {
    await getTasksConfig(folder).update(tasksKey, tasks);
}

export function getTasksVersion(folder: WorkspaceFolder): string | undefined {
    return getTasksConfig(folder).get<string>(versionKey);
}

export async function updateTasksVersion(folder: WorkspaceFolder, version: string): Promise<void> {
    await getTasksConfig(folder).update(versionKey, version);
}

function getTasksConfig(folder: WorkspaceFolder): WorkspaceConfiguration {
    return workspace.getConfiguration(tasksKey, folder.uri);
}

export function convertTaskLabel(label: string, type: string): string {
    return `${label} (${type})`;
}

export interface ITasksJson {
    version: string;
    tasks?: ITask[];
}

export interface ITask extends TaskDefinition {
    label?: string;
    command?: string;
    options?: ITaskOptions;
    dependsOn?: string[];
}

export interface ITaskOptions {
    cwd?: string;
    env?: {
        [key: string]: string;
    };
}

export class SwaShellExecution extends ShellExecution {
    constructor(args: string[], options?: ShellExecutionOptions) {
        super(swa, args, options);
    }
}

export class SwaTask extends Task {
    constructor(scope: WorkspaceFolder, name: string, execution: ShellExecution) {

        const taskDefinition: TaskDefinition = {
            type: shell
        };

        super(taskDefinition, scope, name, swa, execution, swaWatchProblemMatcher);
        this.isBackground = true;
    }
}
