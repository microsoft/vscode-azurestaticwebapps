/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext, IAzureQuickPickItem } from "@microsoft/vscode-azext-utils";
import * as path from 'path';
import { FileType, MessageItem, OpenDialogOptions, Uri, WorkspaceFolder, commands, workspace } from "vscode";
import { cloneRepo } from '../commands/github/cloneRepo';
import { openExistingProject, openRemoteProjectMsg, remoteRepositoriesId } from '../constants';
import { NoWorkspaceError } from '../errors';
import { getApiExport } from "../getExtensionApi";
import { localize } from "./localize";

export function isMultiRootWorkspace(): boolean {
    return !!workspace.workspaceFolders && workspace.workspaceFolders.length > 0
        && workspace.name !== workspace.workspaceFolders[0].name; // multi-root workspaces always have something like "(Workspace)" appended to their name
}

export function getSingleRootFsPath(): Uri | undefined {
    // if this is no workspace or a multi-root workspace, return undefined
    return workspace.workspaceFolders && workspace.workspaceFolders.length === 1 ? workspace.workspaceFolders[0].uri : undefined;
}

export async function selectWorkspaceFolder(context: IActionContext, placeHolder: string, getSubPath?: (f: WorkspaceFolder) => string | undefined | Promise<string | undefined>): Promise<Uri> {
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

export async function selectWorkspaceItem(context: IActionContext, placeHolder: string, options: OpenDialogOptions, getSubPath?: (f: WorkspaceFolder) => string | undefined | Promise<string | undefined>): Promise<Uri> {
    const folders: readonly WorkspaceFolder[] = workspace.workspaceFolders || [];
    const folderPicks: IAzureQuickPickItem<Uri | undefined>[] = await Promise.all(folders.map(async (f: WorkspaceFolder) => {
        let subpath: string | undefined;
        if (getSubPath) {
            subpath = await getSubPath(f);
        }

        const uri: Uri = subpath ? Uri.joinPath(f.uri, subpath) : f.uri;
        return { label: path.basename(uri.fsPath), description: uri.fsPath, data: uri };
    }));

    folderPicks.push({ label: localize('browse', '$(file-directory) Browse...'), description: '', data: undefined });
    const folder: IAzureQuickPickItem<Uri | undefined> = await context.ui.showQuickPick(folderPicks, { placeHolder });

    return folder.data ? folder.data : (await context.ui.showOpenDialog(options))[0];
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
        return workspace.getWorkspaceFolder(folder);
    }
}

export async function showNoWorkspacePrompt(context: IActionContext): Promise<void> {
    const noWorkspaceWarning: string = 'noWorkspaceWarning';
    const message: string = localize(noWorkspaceWarning, 'You must have a git project open to create a Static Web App.');
    const buttons: MessageItem[] = [];
    const cloneProjectMsg: MessageItem = { title: localize('cloneProject', 'Clone project from GitHub') };
    const openExistingProjectMsg: MessageItem = { title: localize(openExistingProject, 'Open local project') };

    const isVirtualWorkspace = workspace.workspaceFolders && workspace.workspaceFolders.every(f => f.uri.scheme !== 'file');
    if (!isVirtualWorkspace) {
        buttons.push(cloneProjectMsg, openExistingProjectMsg);
    }

    if (await getApiExport(remoteRepositoriesId)) {
        buttons.push(openRemoteProjectMsg);
    }

    const result = await context.ui.showWarningMessage(message, { modal: true, stepName: noWorkspaceWarning }, ...buttons);
    if (result === cloneProjectMsg) {
        await cloneRepo(context, '');
        context.telemetry.properties.noWorkspaceResult = 'cloneProject';
    } else if (result === openExistingProjectMsg) {
        await openFolder(context)
        context.telemetry.properties.noWorkspaceResult = openExistingProject;
    } else if (result === openRemoteProjectMsg) {
        await commands.executeCommand('remoteHub.openRepository');
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

export async function getSubFolders(context: IActionContext, uri: Uri): Promise<Uri[]> {
    const files = await workspace.fs.readDirectory(uri);
    const subfolders: Uri[] = [];
    for (const file of files) {
        if (file[1] === FileType.Directory) {
            subfolders.push(Uri.joinPath(uri, file[0]));
        }
    }
    context.telemetry.properties.subfolders = subfolders.length.toString();
    return subfolders;
}
