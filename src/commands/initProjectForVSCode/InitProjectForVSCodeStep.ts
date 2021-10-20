/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { commands, debug, DebugConfiguration, MessageItem, TaskDefinition, Uri, window, WorkspaceFolder } from "vscode";
import { AzExtFsExtra, AzureWizardExecuteStep, IActionContext } from "vscode-azureextensionui";
import { gitignoreFileName } from '../../constants';
import { confirmEditJsonFile } from '../../utils/fs';
import { localize } from "../../utils/localize";
import { nonNullProp, nonNullValueAndProp } from "../../utils/nonNull";
import { isMultiRootWorkspace } from '../../utils/workspaceUtils';
import { CompoundConfiguration, getCompoundConfigs, getDebugConfigs, getLaunchVersion, ILaunchJson, isCompoundConfigEqual, isDebugConfigEqual, updateCompoundConfigs, updateDebugConfigs, updateLaunchVersion } from "../../vsCodeConfig/launch";
import { getTasks, getTasksVersion, ITask, ITasksJson, updateTasks, updateTasksVersion } from "../../vsCodeConfig/tasks";
import { ILocalProjectWizardContext } from "./ILocalProjectWizardContext";

const launchVersion = '0.2.0';
const launchFileName = 'launch.json';
const tasksVersion = '2.0.0';
const tasksFileName = 'tasks.json';

const emulatorAddress = 'http://localhost:4280';

export class InitProjectForVSCodeStep extends AzureWizardExecuteStep<ILocalProjectWizardContext> {

    public priority: number = 100;

    public async execute(wizardContext: ILocalProjectWizardContext): Promise<void> {

        const folder = nonNullValueAndProp(wizardContext, 'workspaceFolder');
        const configName: string = nonNullProp(wizardContext, 'swaCliConfig').name;

        const debugConfigs: DebugConfiguration[] = [];

        const swaConfig = {
            name: `Run ${configName}`,
            request: "launch",
            type: 'pwa-chrome',
            url: emulatorAddress,
            preLaunchTask: `swa start ${configName}`,
            presentation: {
                hidden: true
            },
            webRoot: path.join('${workspaceFolder}', nonNullValueAndProp(wizardContext, 'appLocation'))
        };

        debugConfigs.push(swaConfig);

        if (wizardContext.apiLocation) {
            await commands.executeCommand('azureFunctions.initProjectForVSCode', path.join(folder.uri.fsPath, wizardContext.apiLocation));
            const funcDebugConfig = getDebugConfigs(folder).find((config) => config.preLaunchTask === "func: host start");
            if (funcDebugConfig) {
                debugConfigs.push(funcDebugConfig);
            }
        }

        const tasks: ITask[] = await this.getTasks(wizardContext);

        const compounds = this.getCompoundConfig(configName, debugConfigs);

        const vscodePath: string = path.join(folder.uri.fsPath, '.vscode');
        await AzExtFsExtra.ensureDir(vscodePath);
        await this.writeTasksJson(wizardContext, vscodePath, tasks);
        await this.writeLaunchJson(wizardContext, folder, vscodePath, [compounds], debugConfigs);

        // Remove '.vscode' from gitignore if applicable
        const gitignorePath: string = path.join(folder.uri.fsPath, gitignoreFileName);
        if (await AzExtFsExtra.pathExists(gitignorePath)) {
            let gitignoreContents: string = await AzExtFsExtra.readFile(gitignorePath);
            gitignoreContents = gitignoreContents.replace(/^\.vscode(\/|\\)?\s*$/gm, '');
            await AzExtFsExtra.writeFile(gitignorePath, gitignoreContents);
        }

        const startDebugging = localize('startDebugging', 'Start Debugging {0}', configName);
        void window.showInformationMessage('Finished setting up debugging', startDebugging).then(async (action) => {
            if (action === startDebugging) {
                await debug.startDebugging(folder, compounds.name);
            }
        });
    }

    public shouldExecute(): boolean {
        return true;
    }

    private async getTasks(context: ILocalProjectWizardContext): Promise<ITask[]> {
        const appLocation = nonNullValueAndProp(context, 'appLocation');
        const swaCliConfig = nonNullValueAndProp(context, 'swaCliConfig');
        const workspaceFolder = nonNullProp(context, 'workspaceFolder');

        const tasks: ITask[] = [];
        const command = `swa start ${swaCliConfig.name}`;

        const swaStartTask: ITask = {
            type: 'shell',
            label: command,
            command: command,
            dependsOn: [],
            isBackground: true,
            problemMatcher: '$swa-watch',
            options: {
                env: {
                    BROWSER: "none"
                }
            }
        } as ITask;

        const npmInstallCwd = path.posix.join('${workspaceFolder}', appLocation);
        if (await AzExtFsExtra.pathExists(Uri.joinPath(workspaceFolder.uri, appLocation, 'package.json'))) {
            const npmInstallTaskLabel = `${swaCliConfig.name}: npm install (swa)`;
            tasks.push({
                type: 'shell',
                label: npmInstallTaskLabel,
                command: 'npm install',
                options: {
                    cwd: npmInstallCwd
                }
            });

            swaStartTask.dependsOn ||= [];
            swaStartTask.dependsOn.push(npmInstallTaskLabel);
        }

        return [swaStartTask, ...tasks];
    }

    private getCompoundConfig(configName: string, debugConfigs: DebugConfiguration[]): CompoundConfiguration {
        return {
            name: `Launch ${configName}`,
            configurations: debugConfigs.map(config => config.name),
            stopAll: true,
            presentation: {
                hidden: false,
                order: 1
            }
        };
    }

    private async writeTasksJson(context: ILocalProjectWizardContext, vscodePath: string, newTasks: TaskDefinition[]): Promise<void> {

        const versionMismatchError: Error = new Error(localize('versionMismatchError', 'The version in your {0} must be "{1}" to work with Azure Static Web Apps.', tasksFileName, tasksVersion));

        // Use VS Code api to update config if folder is open and it's not a multi-root workspace (https://github.com/Microsoft/vscode-azurefunctions/issues/1235)
        // The VS Code api is better for several reasons, including:
        // 1. It handles comments in json files
        // 2. It sends the 'onDidChangeConfiguration' event
        if (context.workspaceFolder && !isMultiRootWorkspace()) {
            const currentVersion: string | undefined = getTasksVersion(context.workspaceFolder);
            if (!currentVersion) {
                await updateTasksVersion(context.workspaceFolder, tasksVersion);
            } else if (currentVersion !== tasksVersion) {
                throw versionMismatchError;
            }
            await updateTasks(context.workspaceFolder, await this.insertNewTasks(context, getTasks(context.workspaceFolder), newTasks));
        } else { // otherwise manually edit json
            const tasksJsonPath: string = path.join(vscodePath, tasksFileName);
            await confirmEditJsonFile(
                context,
                tasksJsonPath,
                async (data: ITasksJson): Promise<ITasksJson> => {
                    if (!data.version) {
                        data.version = tasksVersion;
                    } else if (data.version !== tasksVersion) {
                        throw versionMismatchError;
                    }
                    data.tasks = await this.insertNewTasks(context, data.tasks, newTasks);
                    return data;
                }
            );
        }
    }

    private async insertNewTasks(context: IActionContext, existingTasks: ITask[] | undefined, newTasks: ITask[]): Promise<ITask[]> {
        existingTasks = existingTasks || [];

        // remove new tasks that have an identical existing task
        newTasks = newTasks.filter(t1 => {
            const t1String = JSON.stringify(t1);
            return !existingTasks?.some(t2 => t1String === JSON.stringify(t2));
        });

        const nonMatchingTasks: ITask[] = [];
        const matchingTaskLabels: string[] = [];
        for (const existingTask of existingTasks) {
            const existingLabel = this.getTaskLabel(existingTask);
            if (existingLabel && newTasks.some(newTask => existingLabel === this.getTaskLabel(newTask))) {
                matchingTaskLabels.push(existingLabel);
            } else {
                nonMatchingTasks.push(existingTask);
            }
        }

        if (matchingTaskLabels.length > 0) {
            const message = localize('confirmOverwriteTasks', 'This will overwrite the following tasks in your tasks.json: "{0}"', matchingTaskLabels.join('", "'));
            const overwrite: MessageItem = { title: localize('overwrite', 'Overwrite') };
            await context.ui.showWarningMessage(message, { modal: true, stepName: 'confirmOverwriteTasks' }, overwrite)
        }

        return nonMatchingTasks.concat(...newTasks);
    }

    private getTaskLabel(task: ITask): string | undefined {
        switch (task.type) {
            case 'shell':
            case 'process':
                return task.label;
            default:
                return undefined;
        }
    }

    private async writeLaunchJson(context: IActionContext, folder: WorkspaceFolder | undefined, vscodePath: string, compounds: CompoundConfiguration[], debug: DebugConfiguration[]): Promise<void> {
        const versionMismatchError: Error = new Error(localize('versionMismatchError', 'The version in your {0} must be "{1}" to work with Azure Static Web Apps.', 'launch.json', '0.2.0'));

        // Use VS Code api to update config if folder is open and it's not a multi-root workspace (https://github.com/Microsoft/vscode-azurefunctions/issues/1235)
        // The VS Code api is better for several reasons, including:
        // 1. It handles comments in json files
        // 2. It sends the 'onDidChangeConfiguration' event
        if (folder && !isMultiRootWorkspace()) {
            const currentVersion: string | undefined = getLaunchVersion(folder);
            if (!currentVersion) {
                await updateLaunchVersion(folder, launchVersion);
            } else if (currentVersion !== launchVersion) {
                throw versionMismatchError;
            }
            await updateDebugConfigs(folder, this.insertLaunchConfigs(getDebugConfigs(folder), debug));
            await updateCompoundConfigs(folder, this.insertCompoundConfigs(getCompoundConfigs(folder), compounds));
        } else { // otherwise manually edit json
            const launchJsonPath: string = path.join(vscodePath, launchFileName);
            await confirmEditJsonFile(
                context,
                launchJsonPath,
                (data: ILaunchJson): ILaunchJson => {
                    if (!data.version) {
                        data.version = launchVersion;
                    } else if (data.version !== launchVersion) {
                        throw versionMismatchError;
                    }
                    data.configurations = this.insertLaunchConfigs(data.configurations, debug);
                    data.compounds = this.insertCompoundConfigs(data.compounds, compounds);
                    return data;
                }
            );
        }
    }

    private insertLaunchConfigs(existingConfigs: DebugConfiguration[] | undefined, newConfigs: DebugConfiguration[]): DebugConfiguration[] {
        existingConfigs = existingConfigs || [];
        existingConfigs = existingConfigs.filter(l1 => !newConfigs.some(config => isDebugConfigEqual(l1, config)));
        existingConfigs.push(...newConfigs);
        return existingConfigs;
    }

    private insertCompoundConfigs(existingCompounds: CompoundConfiguration[] | undefined, newCompounds: CompoundConfiguration[]): CompoundConfiguration[] {
        existingCompounds = existingCompounds || [];
        existingCompounds = existingCompounds.filter(l1 => !newCompounds.some(config => isCompoundConfigEqual(l1, config)));
        existingCompounds.push(...newCompounds);
        return existingCompounds;
    }
}
