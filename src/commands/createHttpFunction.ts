/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import * as vscode from 'vscode';
import { IActionContext, UserCancelledError } from "vscode-azureextensionui";
import { AzureExtensionApiProvider } from 'vscode-azureextensionui/api';
import { apiSubpathSetting, defaultApiLocation } from '../constants';
import { ext } from '../extensionVariables';
import { localize } from '../utils/localize';
import { getWorkspaceSetting } from '../utils/settingsUtils';
import { AzureFunctionsExtensionApi } from '../vscode-azurefunctions.api';

export async function createHttpFunction(context: IActionContext): Promise<void> {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length <= 0) {
        const noWorkspaceError: string = localize('noWorkspace', 'This action cannot be completed because there is no workspace opened.  Please open a workspace.');
        context.errorHandling.suppressReportIssue = true;
        throw new Error(noWorkspaceError);
    }

    const funcApi: AzureFunctionsExtensionApi = await getFunctionsApi(context);

    const apiLocation: string = getWorkspaceSetting(apiSubpathSetting, vscode.workspace.workspaceFolders[0].uri.fsPath) || defaultApiLocation;
    const folderPath: string = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, apiLocation);

    await funcApi.createFunction({
        folderPath,
        suppressCreateProjectPrompt: true,
        templateId: 'HttpTrigger',
        languageFilter: /Python|C\#|^(Java|Type)Script$/i,
        functionSettings: { authLevel: 'anonymous' }
    });
}

async function getFunctionsApi(context: IActionContext): Promise<AzureFunctionsExtensionApi> {
    const funcExtensionId: string = 'ms-azuretools.vscode-azurefunctions';
    const funcExtension: vscode.Extension<AzureExtensionApiProvider> | undefined = vscode.extensions.getExtension(funcExtensionId);

    if (funcExtension) {
        if (!funcExtension.isActive) {
            await funcExtension.activate();
        }

        return funcExtension.exports.getApi<AzureFunctionsExtensionApi>('^1.2.0');
    }

    await ext.ui.showWarningMessage(localize('funcInstall', 'You must have the "Azure Functions" extension installed to perform this operation.'), { title: 'Install' });
    const commandToRun: string = 'extension.open';
    vscode.commands.executeCommand(commandToRun, funcExtensionId);

    context.telemetry.properties.cancelStep = 'installFunctions';
    // we still need to throw an error even if the user installs
    throw new UserCancelledError();
}
