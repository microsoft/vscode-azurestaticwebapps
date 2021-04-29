/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { commands, MessageItem, OpenDialogOptions, Uri, window, workspace, WorkspaceFolder } from "vscode";
import { IActionContext, IAzureQuickPickItem, UserCancelledError } from "vscode-azureextensionui";
import { NoWorkspaceError } from '../errors';
import { ext } from '../extensionVariables';
import { localize } from "./localize";

export function getSingleRootFsPath(): string | undefined {
    // if this is no workspace or a multi-root workspace, return undefined
    return workspace.workspaceFolders && workspace.workspaceFolders.length === 1 ? workspace.workspaceFolders[0].uri.fsPath : undefined;
}

export async function selectWorkspaceFolder(placeHolder: string, getSubPath?: (f: WorkspaceFolder) => string | undefined | Promise<string | undefined>): Promise<string> {
    return await selectWorkspaceItem(
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

export async function selectWorkspaceItem(placeHolder: string, options: OpenDialogOptions, getSubPath?: (f: WorkspaceFolder) => string | undefined | Promise<string | undefined>): Promise<string> {
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
    const folder: IAzureQuickPickItem<string | undefined> = await ext.ui.showQuickPick(folderPicks, { placeHolder });

    return folder.data ? folder.data : (await ext.ui.showOpenDialog(options))[0].fsPath;
}

export async function getWorkspaceFolder(context: IActionContext): Promise<WorkspaceFolder> {
    let folder: WorkspaceFolder | undefined;
    if (!workspace.workspaceFolders || workspace.workspaceFolders.length === 0) {
        const message: string = localize('noWorkspaceWarning', 'You must have a git project open to create a Static Web App.');
        const cloneProject: MessageItem = { title: localize('cloneProject', 'Clone project from GitHub') };
        const openExistingProject: MessageItem = { title: localize('openExistingProject', 'Open existing project') };
        const result: MessageItem = await context.ui.showWarningMessage(message, { modal: true }, openExistingProject, cloneProject);

        if (result === cloneProject) {
            await commands.executeCommand('git.clone');
            context.telemetry.properties.noWorkspaceResult = 'cloneProject';
        } else {
            const uri: Uri[] = await context.ui.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                openLabel: localize('open', 'Open')
            });
            // don't wait
            void commands.executeCommand('vscode.openFolder', uri[0]);
            context.telemetry.properties.noWorkspaceResult = 'openExistingProject';
        }

        context.errorHandling.suppressDisplay = true;
        throw new NoWorkspaceError();
    } else if (workspace.workspaceFolders.length === 1) {
        folder = workspace.workspaceFolders[0];
    } else {
        const placeHolder: string = localize('selectProjectFolder', 'Select the folder containing your SWA project');
        folder = await window.showWorkspaceFolderPick({ placeHolder });
        if (!folder) {
            throw new UserCancelledError();
        }
    }

    return folder;
}
