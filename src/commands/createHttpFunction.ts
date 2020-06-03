/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fse from 'fs-extra';
import * as path from 'path';
import * as vscode from 'vscode';
import { IActionContext, UserCancelledError } from "vscode-azureextensionui";
import { AzureExtensionApiProvider } from 'vscode-azureextensionui/api';
import { defaultApiName } from '../constants';
import { ext } from '../extensionVariables';
import { localize } from '../utils/localize';
import { AzureFunctionsExtensionApi } from '../vscode-azurefunctions.api';

export async function createHttpFunction(context: IActionContext): Promise<void> {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length <= 0) {
        const noWorkspaceError: string = localize('noWorkspace', 'This action cannot be completed because there is no workspace opened.  Please open a workspace.');
        throw new Error(noWorkspaceError);
    }

    const funcApi: AzureFunctionsExtensionApi = await getFunctionsApi(context);

    const endpointName: string = 'endpoint';
    const folderPath: string = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, defaultApiName);

    const maxTries: number = 100;
    let count: number = 1;
    let newName: string = endpointName;

    while (count < maxTries) {
        newName = generateSuffixedName(endpointName, count);
        if (await isNameAvailable(folderPath, newName)) {
            break;
        }
        count += 1;
    }

    newName = await ext.ui.showInputBox({
        value: newName, prompt: localize('enterHttpFuncName', 'Provide a unique HTTP Function name for your API'), validateInput: async (value) => {
            return await isNameAvailable(folderPath, value) ? undefined : localize('httpFuncNameNotAvailable', 'The HTTP Function name "{0}" already exists in your API.', value);
        }
    });

    await funcApi.createFunction({
        folderPath,
        functionName: newName,
        suppressCreateProjectPrompt: true,
        templateId: 'HttpTrigger',
        languageFilter: /^(Java|Type)Script$/i,
        functionSettings: { authLevel: 'anonymous' }
    });
}

function generateSuffixedName(preferredName: string, i: number): string {
    const suffix: string = i.toString();

    const unsuffixedName: string = preferredName;
    return unsuffixedName + suffix;
}

async function isNameAvailable(folderPath: string, newName: string): Promise<boolean> {
    return !(await fse.pathExists(path.join(folderPath, newName)));
}

async function getFunctionsApi(context: IActionContext): Promise<AzureFunctionsExtensionApi> {
    const funcExtensionId: string = 'ms-azuretools.vscode-azurefunctions';
    const funcExtension: vscode.Extension<AzureExtensionApiProvider> | undefined = vscode.extensions.getExtension(funcExtensionId);

    if (funcExtension) {
        if (!funcExtension.isActive) {
            await funcExtension.activate();
        }

        return funcExtension.exports.getApi<AzureFunctionsExtensionApi>('^1.1.0');
    }

    await ext.ui.showWarningMessage(localize('funcInstall', 'You must have the "Azure Functions" extension installed to perform this operation.'), { title: 'Install' });
    const commandToRun: string = 'extension.open';
    vscode.commands.executeCommand(commandToRun, funcExtensionId);

    context.telemetry.properties.cancelStep = 'installFunctions';
    // we still need to throw an error even if the user installs
    throw new UserCancelledError();
}
