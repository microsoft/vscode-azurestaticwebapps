/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { workspace } from "vscode";

// tslint:disable-next-line:export-name
export function getSingleRootFsPath(): string | undefined {
    // if this is no workspace or a multi-root workspace, return undefined
    return workspace.workspaceFolders && workspace.workspaceFolders.length === 1 ? workspace.workspaceFolders[0].uri.fsPath : undefined;
}
