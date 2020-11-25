/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { OpenDialogOptions, workspace, WorkspaceFolder } from "vscode";
import { IAzureQuickPickItem } from "vscode-azureextensionui";
import { ext } from '../extensionVariables';
import { localize } from "./localize";

// tslint:disable-next-line:export-name
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
    // tslint:disable-next-line: strict-boolean-expressions
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
