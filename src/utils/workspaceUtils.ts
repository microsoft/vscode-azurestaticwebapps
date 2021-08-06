/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { commands, MessageItem, OpenDialogOptions, Uri, workspace, WorkspaceFolder } from "vscode";
import { IActionContext, IAzureQuickPickItem, UserCancelledError } from "vscode-azureextensionui";
import { cloneProjectMsg, openExistingProject, openExistingProjectMsg } from '../constants';
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
        if (folder === undefined) {
            throw new UserCancelledError(selectAppFolder);
        }
        context.telemetry.properties.noWorkspaceResult = 'multiRootProject';
        return workspace.getWorkspaceFolder(Uri.parse(folder));
    }
}

export async function showNoWorkspacePrompt(context: IActionContext): Promise<MessageItem> {
    const noWorkspaceWarning: string = 'noWorkspaceWarning';
    const message: string = localize(noWorkspaceWarning, 'You must have a git project open to create a Static Web App.');
    return await context.ui.showWarningMessage(message, { modal: true, stepName: noWorkspaceWarning }, openExistingProjectMsg, cloneProjectMsg);
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
