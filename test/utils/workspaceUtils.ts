/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { workspace, WorkspaceFolder } from "vscode";

export function getWorkspacePath(workspaceName: string): string {
    const workspaceFolders: readonly WorkspaceFolder[] | undefined = workspace.workspaceFolders;

    assert.ok(workspaceFolders && workspaceFolders.length, 'No workspace is open.');

    const workspaceFolder: WorkspaceFolder | undefined = workspaceFolders.find(folder => folder.name === workspaceName);
    const workspacePath: string | undefined = workspaceFolder?.uri.fsPath;

    assert.ok(workspacePath, `Workspace "${workspaceName}" is not open.`);

    return workspacePath;
}
