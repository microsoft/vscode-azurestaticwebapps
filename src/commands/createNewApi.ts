/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { ext } from '../extensionVariables';
import { localize } from '../utils/localize';

export async function createNewApi(): Promise<void> {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length <= 0) {
        throw new Error();
    }

    const apiLanguage: string = (await ext.ui.showQuickPick([{ label: 'JavaScript' }, { label: 'TypeScript' }], { placeHolder: 'Select a language for the API...' })).label;
    const skipForNow: string = localize('skipForNow', '$(clock) Skip for now');
    const triggerPrompt: string = (await ext.ui.showQuickPick([{ label: 'Yes', data: 'HttpTrigger' }, { label: skipForNow, data: 'skipForNow' }], { placeHolder: 'Create an API endpoint...' })).data;

    let endpointName: string | undefined;

    if (triggerPrompt !== 'skipForNow') {
        endpointName = (await ext.ui.showInputBox({ prompt: 'Provide an endpoint name', value: 'endpoint1' }));
    }

    await vscode.commands.executeCommand('azureFunctions.createNewProject', `${vscode.workspace.workspaceFolders[0].uri.fsPath}/api`, apiLanguage, undefined, true, triggerPrompt, 'endpoint1', { authLevel: 'anonymous' });
}
