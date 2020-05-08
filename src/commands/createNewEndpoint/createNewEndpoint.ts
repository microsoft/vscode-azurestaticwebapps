/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fse from 'fs-extra';
import * as path from 'path';
import * as vscode from 'vscode';
import { IActionContext } from "vscode-azureextensionui";
import { noWorkspaceError } from '../../constants';
import { ext } from '../../extensionVariables';
import { validateFuncExtInstalled } from '../validateFuncExtInstalled';

export async function createNewEndpoint(context: IActionContext): Promise<void> {
    await validateFuncExtInstalled(context);

    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length <= 0) {
        throw new Error(noWorkspaceError);
    }

    const endpointName: string = 'endpoint';
    const projectPath: string = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'api');

    const maxTries: number = 100;
    let count: number = 1;
    let newName: string = endpointName;

    while (count < maxTries) {
        newName = generateSuffixedName(endpointName, count);
        if (await isRelatedNameAvailable(projectPath, newName)) {
            break;
        }
        count += 1;
    }

    newName = await ext.ui.showInputBox({ value: newName, prompt: 'Provide an endpoint name' });
    await vscode.commands.executeCommand('azureFunctions.createFunction', projectPath, 'HttpTrigger', newName, { authLevel: 'anonymous' });

}

function generateSuffixedName(preferredName: string, i: number): string {
    const suffix: string = i.toString();

    const unsuffixedName: string = preferredName;
    return unsuffixedName + suffix;
}

async function isRelatedNameAvailable(projectPath: string, newName: string): Promise<boolean> {
    return !(await fse.pathExists(path.join(projectPath, newName)));
}
