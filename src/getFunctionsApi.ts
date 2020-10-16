/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { commands, Extension, extensions } from "vscode";
import { IActionContext, UserCancelledError } from "vscode-azureextensionui";
import { AzureExtensionApiProvider } from "vscode-azureextensionui/api";
import { ext } from "./extensionVariables";
import { localize } from "./utils/localize";
import { AzureFunctionsExtensionApi } from "./vscode-azurefunctions.api";

export async function getFunctionsApi(context: IActionContext): Promise<AzureFunctionsExtensionApi> {
    const funcExtensionId: string = 'ms-azuretools.vscode-azurefunctions';
    const funcExtension: Extension<AzureExtensionApiProvider> | undefined = extensions.getExtension(funcExtensionId);

    if (funcExtension) {
        if (!funcExtension.isActive) {
            await funcExtension.activate();
        }

        return funcExtension.exports.getApi<AzureFunctionsExtensionApi>('^1.3.0');
    }

    await ext.ui.showWarningMessage(localize('funcInstall', 'You must have the "Azure Functions" extension installed to perform this operation.'), { title: 'Install' });
    const commandToRun: string = 'extension.open';
    commands.executeCommand(commandToRun, funcExtensionId);

    context.telemetry.properties.cancelStep = 'installFunctions';
    // we still need to throw an error even if the user installs
    throw new UserCancelledError();
}
