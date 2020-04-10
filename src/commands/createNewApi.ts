/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

export async function createNewApi(): Promise<void> {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length <= 0) {
        throw new Error();
    }

    await vscode.commands.executeCommand('azureFunctions.createNewProject', vscode.workspace.workspaceFolders[0].uri.fsPath, 'JavaScript', undefined, true, 'HttpTrigger-JavaScript', 'GetList');
}
