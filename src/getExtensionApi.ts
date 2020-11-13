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
    const funcExtension: AzureExtensionApiProvider | undefined = await getApiExport(funcExtensionId);

    if (funcExtension) {
        return funcExtension.getApi<AzureFunctionsExtensionApi>('^1.3.0');
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
        const gitExtension: GitExtension | undefined = await getApiExport('vscode.git');
        if (gitExtension) {
            return gitExtension.getAPI(1);
        }
    } catch (err) {
        // the getExtension error is very vague and unactionable so swallow and throw our own error
    }

    throw new Error(localize('gitEnabled', 'If you would like to use git features, please enable git in your [settings](command:workbench.action.openSettings?%5B%22git.enabled%22%5D). To learn more about how to use git and source control in VS Code [read our docs](https://aka.ms/vscode-scm).'));
}

export async function getApiExport<T>(extensionId: string): Promise<T | undefined> {
    const extension: Extension<T> | undefined = extensions.getExtension(extensionId);
    if (extension) {
        if (!extension.isActive) {
            await extension.activate();
        }

        return extension.exports;
    }

    return undefined;
}
