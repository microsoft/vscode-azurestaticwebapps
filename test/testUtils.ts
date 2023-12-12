/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import * as path from 'path';
import { workspace, type Uri, type WorkspaceFolder } from "vscode";

export function getWorkspaceUri(testWorkspaceName: string): Uri {
    let workspaceUri: Uri | undefined = undefined;
    const workspaceFolders: readonly WorkspaceFolder[] | undefined = workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        throw new Error("No workspace is open");
    } else {
        for (const obj of workspaceFolders) {
            if (obj.name === testWorkspaceName) {
                workspaceUri = obj.uri;
                assert.strictEqual(path.basename(workspaceUri.fsPath), testWorkspaceName, "Opened against an unexpected workspace.");
                return workspaceUri;
            }
        }
    }

    throw new Error(`Unable to find workspace "${testWorkspaceName}""`)
}
