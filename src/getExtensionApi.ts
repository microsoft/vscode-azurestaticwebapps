/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { commands, Extension, extensions } from "vscode";
import { IActionContext, UserCancelledError } from "vscode-azureextensionui";
import { AzureExtensionApiProvider } from "vscode-azureextensionui/api";
import { API, GitExtension } from "./git";
import { localize } from "./utils/localize";
import { getWorkspaceSetting } from "./utils/settingsUtils";
import { AzureFunctionsExtensionApi } from "./vscode-azurefunctions.api";

export async function getFunctionsApi(context: IActionContext): Promise<AzureFunctionsExtensionApi> {
    const funcExtensionId: string = 'ms-azuretools.vscode-azurefunctions';
    const funcExtension: AzureExtensionApiProvider | undefined = await getApiExport(funcExtensionId);

    if (funcExtension) {
        return funcExtension.getApi<AzureFunctionsExtensionApi>('^1.3.0');
    }

    await context.ui.showWarningMessage(localize('funcInstall', 'You must have the "Azure Functions" extension installed to perform this operation.'), { title: 'Install', stepName: 'installFunctions' });
    const commandToRun: string = 'extension.open';
    void commands.executeCommand(commandToRun, funcExtensionId);

    // we still need to throw an error even if the user installs
    throw new UserCancelledError('postInstallFunctions');
}

export async function getGitApi(): Promise<API> {
    try {
        const gitExtension: GitExtension | undefined = await getApiExport('vscode.git');
        if (gitExtension) {
            return gitExtension.getAPI(1);
        }
    } catch (err) {
        if (!getWorkspaceSetting<boolean>('enabled', undefined, 'git')) {
            // the getExtension error is very vague and unactionable so throw our own error if git isn't enabled
            throw new Error(localize('gitEnabled', 'If you would like to use git features, please enable git in your [settings](command:workbench.action.openSettings?%5B%22git.enabled%22%5D). To learn more about how to use git and source control in VS Code [read our docs](https://aka.ms/vscode-scm).'));
        } else {
            throw err;
        }
    }

    throw new Error(localize('unableGit', 'Unable to retrieve VS Code Git API.  Please ensure git is properly installed and reload VS Code.'));
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
