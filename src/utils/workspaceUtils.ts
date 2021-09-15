/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { commands, FileType, MessageItem, OpenDialogOptions, Uri, workspace, WorkspaceFolder } from "vscode";
import { IActionContext, IAzureQuickPickItem } from "vscode-azureextensionui";
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

export async function showNoWorkspacePrompt(context: IActionContext): Promise<void> {
    const noWorkspaceWarning: string = 'noWorkspaceWarning';
    const message: string = localize(noWorkspaceWarning, 'You must have a git project open to create a Static Web App.');
    const cloneProjectMsg: MessageItem = { title: localize('cloneProject', 'Clone project from GitHub') };
    const openExistingProjectMsg: MessageItem = { title: localize(openExistingProject, 'Open existing project') };
    const result = await context.ui.showWarningMessage(message, { modal: true, stepName: noWorkspaceWarning }, openExistingProjectMsg, cloneProjectMsg);
    if (result === cloneProjectMsg) {
        await cloneRepo(context, '');
        context.telemetry.properties.noWorkspaceResult = 'cloneProject';
    } else if (result === openExistingProjectMsg) {
        await openFolder(context)
        context.telemetry.properties.noWorkspaceResult = openExistingProject;
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

export async function findSubFolders(folder: WorkspaceFolder): Promise<string[]> {
    const fsPaths: string[] = [folder.uri.fsPath];
    const rootDir = folder.uri;

    const dirContents = await workspace.fs.readDirectory(rootDir);
    for (const content of dirContents) {
        if (content[1] === FileType.Directory) {
            fsPaths.push(path.join(rootDir.fsPath, content[0]));
        }
    }

    return fsPaths;
}
