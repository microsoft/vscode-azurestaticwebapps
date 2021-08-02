/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { commands, MessageItem, OpenDialogOptions, Uri, window, workspace, WorkspaceFolder } from "vscode";
import { AzureWizard, IActionContext, IAzureQuickPickItem, UserCancelledError } from "vscode-azureextensionui";
import { CreateRepoFromTemplateStep } from '../commands/createRepo/CreateRepoFromTemplateStep';
import { PickTemplateStep } from '../commands/createRepo/PickTemplateStep';
import { TemplateRepoNameStep } from '../commands/createRepo/TemplateRepoNameStep';
import { IStaticWebAppWizardContext } from '../commands/createStaticWebApp/IStaticWebAppWizardContext';
import { cloneRepo } from '../commands/github/cloneRepo';
import { NoWorkspaceError } from '../errors';
import { localize } from "./localize";
import { nonNullProp } from './nonNull';

export function getSingleRootFsPath(): string | undefined {
    // if this is no workspace or a multi-root workspace, return undefined
    return workspace.workspaceFolders && workspace.workspaceFolders.length === 1 ? workspace.workspaceFolders[0].uri.fsPath : undefined;
}

export async function selectWorkspaceFolder(context: IActionContext, placeHolder: string, getSubPath?: (f: WorkspaceFolder) => string | undefined | Promise<string | undefined>): Promise<string> {
    return await selectWorkspaceItem(
        context,
        placeHolder,
        {
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            defaultUri: workspace.workspaceFolders && workspace.workspaceFolders.length > 0 ? workspace.workspaceFolders[0].uri : undefined,
            openLabel: localize('select', 'Select')
        },
        getSubPath);
}

export async function selectWorkspaceItem(context: IActionContext, placeHolder: string, options: OpenDialogOptions, getSubPath?: (f: WorkspaceFolder) => string | undefined | Promise<string | undefined>): Promise<string> {
    const folders: readonly WorkspaceFolder[] = workspace.workspaceFolders || [];
    const folderPicks: IAzureQuickPickItem<string | undefined>[] = await Promise.all(folders.map(async (f: WorkspaceFolder) => {
        let subpath: string | undefined;
        if (getSubPath) {
            subpath = await getSubPath(f);
        }

        const fsPath: string = subpath ? path.join(f.uri.fsPath, subpath) : f.uri.fsPath;
        return { label: path.basename(fsPath), description: fsPath, data: fsPath };
    }));

    folderPicks.push({ label: localize('browse', '$(file-directory) Browse...'), description: '', data: undefined });
    const folder: IAzureQuickPickItem<string | undefined> = await context.ui.showQuickPick(folderPicks, { placeHolder });

    return folder.data ? folder.data : (await context.ui.showOpenDialog(options))[0].fsPath;
}

export async function getWorkspaceFolder(context: IActionContext): Promise<WorkspaceFolder> {
    let folder: WorkspaceFolder | undefined;
    context.telemetry.properties.noWorkspaceResult = 'canceled';

    if (!workspace.workspaceFolders || workspace.workspaceFolders.length === 0) {
        const noWorkspaceWarning: string = 'noWorkspaceWarning';
        const message: string = localize(noWorkspaceWarning, 'You must have a git project open to create a Static Web App.');
        const cloneProject: MessageItem = { title: localize('cloneProject', 'Clone from GitHub') };
        const openExistingProject: string = 'openExistingProject';
        const openExistingProjectMi: MessageItem = { title: localize(openExistingProject, 'Open existing') };
        const createFromTemplate: MessageItem = { title: localize('createFromTemplate', 'Create from template')};
        const result: MessageItem = await context.ui.showWarningMessage(message, { modal: true, stepName: noWorkspaceWarning }, openExistingProjectMi, cloneProject, createFromTemplate);

        if (result === cloneProject) {
            await cloneRepo(context, '');
            context.telemetry.properties.noWorkspaceResult = 'cloneProject';
        } else if (result === openExistingProjectMi) {
            const uri: Uri[] = await context.ui.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                openLabel: localize('open', 'Open'),
                stepName: openExistingProject
            });
            // don't wait
            void commands.executeCommand('vscode.openFolder', uri[0]);
            context.telemetry.properties.noWorkspaceResult = openExistingProject;
        } else {
            const wizardContext: Partial<IStaticWebAppWizardContext> & IActionContext = context;
            const createFromTemplateWizard = new AzureWizard(wizardContext, {
                title: localize('createFromTemplateTitle', 'Create repository from template'),
                promptSteps: [new PickTemplateStep(), new TemplateRepoNameStep()],
                executeSteps: [new CreateRepoFromTemplateStep()]
            });
            await createFromTemplateWizard.prompt();
            await createFromTemplateWizard.execute();
            await cloneRepo(context, nonNullProp(wizardContext, 'repoCreatedFromTemplate').data.html_url);
            context.telemetry.properties.noWorkspaceResult = 'createFromTemplate';
        }

        context.errorHandling.suppressDisplay = true;
        throw new NoWorkspaceError();
    } else if (workspace.workspaceFolders.length === 1) {
        folder = workspace.workspaceFolders[0];
        context.telemetry.properties.noWorkspaceResult = 'singleRootProject';
    } else {
        const selectProjectFolder: string = 'selectProjectFolder';
        const placeHolder: string = localize(selectProjectFolder, 'Select the folder containing your SWA project');
        folder = await window.showWorkspaceFolderPick({ placeHolder });
        if (!folder) {
            throw new UserCancelledError(selectProjectFolder);
        }

        context.telemetry.properties.noWorkspaceResult = 'multiRootProject';
    }

    return folder;
}
