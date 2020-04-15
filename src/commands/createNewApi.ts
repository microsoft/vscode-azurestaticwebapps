/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { ext } from '../extensionVariables';

export async function createNewApi(): Promise<void> {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length <= 0) {
        throw new Error();
    }

    const apiLanguage: string = (await ext.ui.showQuickPick([{ label: 'JavaScript' }, { label: 'TypeScript' }], { placeHolder: 'Select a language for the API...' })).label;

    await vscode.commands.executeCommand('azureFunctions.createNewProject', `${vscode.workspace.workspaceFolders[0].uri.fsPath}/api`, apiLanguage, undefined, true, 'HttpTrigger', 'endpoint1', { authLevel: 'anonymous' });
}
