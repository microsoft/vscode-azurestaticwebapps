/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra, callWithTelemetryAndErrorHandling, IActionContext } from "@microsoft/vscode-azext-utils";
import * as path from 'path';
import { Task, TaskProvider, workspace, WorkspaceFolder } from "vscode";
import { buildPresets } from "../buildPresets/buildPresets";
import { tryGetApiLocations } from "../commands/createStaticWebApp/tryGetApiLocations";
import { funcAddress } from "../constants";
import { detectAppFoldersInWorkspace } from '../utils/detectorUtils';
import { SwaShellExecution, SwaTask } from "../vsCodeConfig/tasks";
import { getFolderContainingDbConfigFile } from "./dab";
import { SWACLIOptions, tryGetStaticWebAppsCliConfig } from "./tryGetStaticWebAppsCliConfig";

export class SwaTaskProvider implements TaskProvider {

    public async resolveTask(): Promise<Task | undefined> {
        return undefined;
    }

    public async provideTasks(): Promise<Task[]> {
        return await callWithTelemetryAndErrorHandling<Task[]>('staticWebApps.provideTasks', async (context: IActionContext): Promise<Task[]> => {
            const tasks: Task[] = [];
            for await (const workspaceFolder of workspace.workspaceFolders ?? []) {
                const workspaceTasks = await this.provideTasksForWorkspaceFolder(workspaceFolder);
                tasks.push(...workspaceTasks);
            }
            context.telemetry.measurements.workspaceFolderCount = workspace.workspaceFolders?.length ?? 0;
            context.telemetry.measurements.detectedCount = tasks.length;
            return tasks;
        }) ?? [];
    }

    async provideTasksForWorkspaceFolder(workspaceFolder: WorkspaceFolder): Promise<Task[]> {
        return await callWithTelemetryAndErrorHandling<Task[]>('staticWebApps.provideTasksForWorkspaceFolder', async (context: IActionContext): Promise<Task[]> => {
            const tasks: Task[] = [];
            if (await AzExtFsExtra.pathExists(workspaceFolder.uri)) {
                const configTasks = await this.getTasksFromSwaConfig(workspaceFolder);
                const detectorTasks = await this.getTasksFromDetector(context, workspaceFolder);
                tasks.push(...configTasks, ...detectorTasks);
                context.telemetry.measurements.configCount = configTasks.length;
                context.telemetry.measurements.detectedCount = detectorTasks.length;
            }
            return tasks;
        }) ?? [];
    }

    private async getTasksFromDetector(context: IActionContext, workspaceFolder: WorkspaceFolder): Promise<Task[]> {
        const tasks: Task[] = [];

        const apiLocations = await tryGetApiLocations(context, workspaceFolder, true);
        const appFolders = await detectAppFoldersInWorkspace(context, workspaceFolder);
        const dbConfigDirPath = await getFolderContainingDbConfigFile(workspaceFolder);

        appFolders.forEach((appFolder) => {
            const buildPreset = buildPresets.find((preset) => appFolder.frameworks.find((info) => info.framework === preset.displayName));

            if (buildPreset) {
                tasks.push(this.createSwaCliTask(workspaceFolder, `start ${path.basename(appFolder.uri.fsPath)}`, {
                    context: `http://localhost:${buildPreset.port}`,
                    ...(apiLocations?.length ? { apiLocation: funcAddress } : {}),
                    appLocation: path.relative(workspaceFolder.uri.fsPath, appFolder.uri.fsPath),
                    run: buildPreset.startCommand ?? 'npm start',
                    ...(dbConfigDirPath ? { dataApiLocation: dbConfigDirPath } : {})
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
        const args: string[] = ['start'];
        if (configurationName) {
            args.push(configurationName);
        }

        return new SwaTask(
            workspaceFolder,
            args.join(' '),
            new SwaShellExecution(args)
        );
    }

    private createSwaCliTask(workspaceFolder: WorkspaceFolder, label: string, options: Pick<SWACLIOptions, 'context' | 'apiLocation' | 'run' | 'appLocation' | 'dataApiLocation'>): Task {

        const addArg = <T extends Record<string, string>>(object: T, property: keyof T, name?: string): string[] => {
            const args: string[] = [];
            if (object[property]) {
                args.push(`--${name ?? property.toString()}`);
                args.push(object[property] as string);
            }
            return args;
        };

        const args: string[] = [
            'start',
            ...(options.context ? [options.context] : []),
            ...addArg(options, 'appLocation', 'app-location'),
            ...addArg(options, 'apiLocation', 'api-location'),
            ...addArg(options, 'run', 'run'),
            ...addArg(options, 'dataApiLocation', 'data-api-location'),
            // Increase devserver timeout to 3x default. See https://github.com/microsoft/vscode-azurestaticwebapps/issues/574#issuecomment-965590774
            '--devserver-timeout=90000'
        ];

        return new SwaTask(
            workspaceFolder,
            label,
            new SwaShellExecution(
                args,
                {
                    // Prevent react-scrips auto opening browser
                    env: {
                        BROWSER: 'none'
                    }
                }
            )
        );
    }
}
