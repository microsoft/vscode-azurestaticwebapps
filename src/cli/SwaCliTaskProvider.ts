/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { ShellExecution, Task, TaskProvider, workspace, WorkspaceFolder } from "vscode";
import { callWithTelemetryAndErrorHandling, IActionContext } from "vscode-azureextensionui";
import { buildPresets } from "../buildPresets/buildPresets";
import { tryGetApiLocations } from "../commands/createStaticWebApp/tryGetApiLocations";
import { funcAddress, shell, swa, swaWatchProblemMatcher } from "../constants";
import { detectAppFoldersInWorkspace } from '../utils/detectorUtils';
import { isMultiRootWorkspace } from "../utils/workspaceUtils";
import { SWACLIOptions, tryGetStaticWebAppsCliConfig } from "./tryGetStaticWebAppsCliConfig";

export class SwaTaskProvider implements TaskProvider {

    public async resolveTask(): Promise<Task | undefined> {
        return undefined;
    }

    public async provideTasks(): Promise<Task[]> {
        return await callWithTelemetryAndErrorHandling('staticWebApps.provideTasks', async (context: IActionContext) => {
            const workspaceFolder: WorkspaceFolder | undefined = workspace.workspaceFolders?.[0];
            if (isMultiRootWorkspace() || !workspaceFolder) {
                return [];
            }

            return [...await this.getTasksFromSwaConfig(workspaceFolder), ...await this.getTasksFromDetector(context, workspaceFolder)];
        }) ?? [];
    }

    private async getTasksFromDetector(context: IActionContext, workspaceFolder: WorkspaceFolder): Promise<Task[]> {
        const tasks: Task[] = [];

        const apiLocations = await tryGetApiLocations(context, workspaceFolder);

        const appFolders = await detectAppFoldersInWorkspace(context, workspaceFolder);
        appFolders.forEach((appFolder) => {
            const buildPreset = buildPresets.find((preset) => appFolder.frameworks.find((info) => info.framework === preset.displayName));

            if (buildPreset) {
                tasks.push(this.createSwaCliTask(workspaceFolder, `start ${path.basename(appFolder.uri.fsPath)}`, {
                    context: `http://localhost:${buildPreset.port}`,
                    ...(apiLocations?.length ? { apiLocation: funcAddress } : {}),
                    appLocation: path.relative(workspaceFolder.uri.fsPath, appFolder.uri.fsPath),
                    run: buildPreset.startCommand ?? 'npm start'
                }));
            }
        });

        return tasks;
    }

    private async getTasksFromSwaConfig(workspaceFolder: WorkspaceFolder): Promise<Task[]> {
        const tasks: Task[] = [];

        const swaCliConfigFile = await tryGetStaticWebAppsCliConfig(workspaceFolder?.uri);
        if (swaCliConfigFile && swaCliConfigFile.configurations) {
            Object.keys(swaCliConfigFile.configurations).forEach((configurationName: string) => {
                tasks.push(this.createSwaConfigTask(workspaceFolder, configurationName));
            });

            // if only one configuration present, it can be started with 'swa start'
            if (Object.keys(swaCliConfigFile.configurations).length === 1) {
                tasks.push(this.createSwaConfigTask(workspaceFolder));
            }
        }

        return tasks;
    }

    private createSwaConfigTask(workspaceFolder: WorkspaceFolder, configurationName?: string): Task {
        const command = configurationName ? `start ${configurationName}` : 'start';
        const task = new Task({
            type: shell,
            command,
        }, workspaceFolder, command, swa, new ShellExecution(command), swaWatchProblemMatcher);
        task.isBackground = true;

        return task;
    }

    private createSwaCliTask(workspaceFolder: WorkspaceFolder, label: string, options: Pick<SWACLIOptions, 'context' | 'apiLocation' | 'run' | 'appLocation'>): Task {

        const addArg = <T>(object: T, property: keyof T, name?: string, quote?: boolean): string => {
            return object[property] ? quote ? `--${name ?? property.toString()}='${object[property]}'` : `--${name ?? property.toString()}=${object[property]}` : '';
        };

        const args: string[] = [addArg(options, 'appLocation', 'app-location'), addArg(options, 'apiLocation', 'api-location'), addArg(options, 'run', 'run', true)];
        const command = `swa start ${options.context} ${args.join(' ')}`;
        const task = new Task(
            {
                type: shell,
                command,
            },
            workspaceFolder,
            label,
            swa,
            new ShellExecution(command,
                {
                    // Prevent react-scrips auto opening browser
                    env: {
                        BROWSER: 'none'
                    }
                }
            ),
            swaWatchProblemMatcher
        );

        task.isBackground = true;
        task.detail = command;

        return task;
    }
}
