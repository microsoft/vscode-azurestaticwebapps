/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { commands, Extension, extensions } from "vscode";
import { IActionContext, UserCancelledError } from "vscode-azureextensionui";
import { AzureExtensionApiProvider } from "vscode-azureextensionui/api";
import { ext } from "./extensionVariables";
import { API, GitExtension } from "./git";
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

export async function getGitApi(): Promise<API> {
    try {
        const gitExtension: Extension<GitExtension> | undefined = extensions.getExtension<GitExtension>('vscode.git');
        if (gitExtension) {
            return gitExtension.exports.getAPI(1);
        }
    } catch (err) {
        // the getExtension error is very vague and unactionable so swallow and throw our own error
    }

    throw new Error(localize('gitEnabled', 'If you would like to use git features, please enable git in your [settings](command:workbench.action.openSettings?%5B%22git.enabled%22%5D). To learn more about how to use git and source control in VS Code [read our docs](https://aka.ms/vscode-scm).'));
}
