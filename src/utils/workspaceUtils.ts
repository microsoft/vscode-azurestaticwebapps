/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { commands, MessageItem, OpenDialogOptions, ProgressLocation, ProgressOptions, Uri, window, workspace, WorkspaceFolder } from "vscode";
import { IActionContext, IAzureQuickPickItem } from "vscode-azureextensionui";
import { IStaticWebAppWizardContext } from '../commands/createStaticWebApp/IStaticWebAppWizardContext';
import { setWorkspaceContexts } from '../commands/createStaticWebApp/setWorkspaceContexts';
import { cloneRepo } from '../commands/github/cloneRepo';
import { openExistingProject } from '../constants';
import { NoWorkspaceError } from '../errors';
import { localize } from "./localize";

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

export async function tryGetWorkspaceFolder(context: IActionContext): Promise<WorkspaceFolder | undefined> {
    context.telemetry.properties.noWorkspaceResult = 'canceled';
    if (!workspace.workspaceFolders || workspace.workspaceFolders.length === 0) {
        return;
    } else if (workspace.workspaceFolders.length === 1) {
        context.telemetry.properties.noWorkspaceResult = 'singleRootProject';
        return workspace.workspaceFolders[0];
    } else {
        const selectAppFolder: string = 'selectAppFolder';
        const folder = await selectWorkspaceFolder(context, localize(selectAppFolder, 'Select folder with your app'));
        context.telemetry.properties.noWorkspaceResult = 'multiRootProject';
        return workspace.getWorkspaceFolder(Uri.parse(folder));
    }
}

export async function showNoWorkspacePrompt(context: IActionContext & Partial<IStaticWebAppWizardContext>): Promise<void> {
    const noWorkspaceWarning: string = 'noWorkspaceWarning';
    const message: string = localize(noWorkspaceWarning, 'You must have a git project open to create a Static Web App.');
    const cloneProject = 'cloneProject';
    const cloneProjectMsg: MessageItem = { title: localize(cloneProject, 'Clone from GitHub') };
    const openExistingProjectMsg: MessageItem = { title: localize(openExistingProject, 'Open existing') };
    const createFromTemplate = 'createFromTemplate';
    const createFromTemplateMsg: MessageItem = { title: localize(createFromTemplate, 'Create from template') };

    const result = await context.ui.showWarningMessage(message, { modal: true, stepName: noWorkspaceWarning }, openExistingProjectMsg, cloneProjectMsg, createFromTemplateMsg);
    if (result === cloneProjectMsg) {
        await cloneRepo(context, '');
        context.telemetry.properties.noWorkspaceResult = cloneProject;
    } else if (result === openExistingProjectMsg) {
        await openFolder(context)
        context.telemetry.properties.noWorkspaceResult = openExistingProject;
    } else if (result === createFromTemplateMsg) {
        context.fromTemplate = true;
        context.telemetry.properties.noWorkspaceResult = createFromTemplate;
        return;
    }
    context.errorHandling.suppressDisplay = true;
    throw new NoWorkspaceError();
}

export async function openFolder(context: IActionContext): Promise<void> {
    const uri: Uri[] = await context.ui.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: localize('open', 'Open'),
        stepName: openExistingProject
    });
    // don't wait
    void commands.executeCommand('vscode.openFolder', uri[0]);
}

export async function verifyWorkSpace(context: IActionContext & Partial<IStaticWebAppWizardContext>): Promise<void> {
    const progressOptions: ProgressOptions = {
        location: ProgressLocation.Notification,
        title: localize('verifyingWorkspace', 'Verifying workspace...')
    };
    await window.withProgress(progressOptions, async () => {
        const folder = await tryGetWorkspaceFolder(context);
        if (folder) {
            await setWorkspaceContexts(context, folder);
        } else {
            await showNoWorkspacePrompt(context);
        }
    });
}
