/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fse from 'fs-extra';
import * as path from 'path';
import { workspace, WorkspaceFolder } from "vscode";
import { localSettingsFileName } from "../../constants";
import { ext } from "../../extensionVariables";

/**
 * If only one project is open and the default local settings file exists, return that.
 * Otherwise, prompt
 */
export async function getLocalSettingsFile(folderName?: string): Promise<string> {
    // tslint:disable-next-line: strict-boolean-expressions
    const folders: WorkspaceFolder[] = workspace.workspaceFolders || [];
    if (folderName && folders.length === 1) {
        const workspacePath: string = folderName && path.join(folders[0].uri.fsPath, folderName) || folders[0].uri.fsPath;
        const localSettingsFile: string = path.join(workspacePath, localSettingsFileName);
        if (await fse.pathExists(localSettingsFile)) {
            return localSettingsFile;
        }
    }

    return (await ext.ui.showOpenDialog({ filters: { '': ['settings.json'] } }))[0].fsPath;
}
