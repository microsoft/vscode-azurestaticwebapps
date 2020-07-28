/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fse from 'fs-extra';
import * as path from 'path';
import { workspace, WorkspaceFolder } from "vscode";
import { defaultApiLocation, localSettingsFileName } from "../../constants";
import { ext } from "../../extensionVariables";
import { localize } from '../../utils/localize';

/**
 * If only one project is open and the default local settings file exists, return that.
 * Otherwise, prompt
 */
export async function getLocalSettingsFile(): Promise<string> {
    // tslint:disable-next-line: strict-boolean-expressions
    const folders: readonly WorkspaceFolder[] = workspace.workspaceFolders || [];
    if (folders.length === 1) {
        const workspacePath: string = path.join(folders[0].uri.fsPath, defaultApiLocation) || folders[0].uri.fsPath;
        const localSettingsFile: string = path.join(workspacePath, localSettingsFileName);
        if (await fse.pathExists(localSettingsFile)) {
            return localSettingsFile;
        }
    }

    return (await ext.ui.showOpenDialog({
        canSelectFiles: true,
        canSelectMany: false,
        openLabel: localize('select', 'Select'),
        filters: { '': ['json'] }
    }))[0].fsPath;
}
