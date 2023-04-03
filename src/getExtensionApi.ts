/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext, UserCancelledError } from "@microsoft/vscode-azext-utils";
import { AzureHostExtensionApi } from "@microsoft/vscode-azext-utils/hostapi";
import { apiUtils } from '@microsoft/vscode-azureresources-api';
import { Extension, commands, extensions } from "vscode";
import { IGit } from "./IGit";
import { remoteRepositoriesId } from "./constants";
import { ext } from "./extensionVariables";
import { GitExtension } from "./git";
import { localize } from "./utils/localize";
import { getWorkspaceSetting } from "./utils/settingsUtils";
import { AzureFunctionsExtensionApi } from "./vscode-azurefunctions.api";

/**
 * @param installMessage Override default message shown if extension is not installed.
 */
export async function getFunctionsApi(context: IActionContext, installMessage?: string): Promise<AzureFunctionsExtensionApi> {
    const funcExtensionId: string = 'ms-azuretools.vscode-azurefunctions';
    const funcExtension: apiUtils.AzureExtensionApiProvider | undefined = await apiUtils.getExtensionExports(funcExtensionId);

    if (funcExtension) {
        return funcExtension.getApi<AzureFunctionsExtensionApi>('^1.7.0');
    }

    await context.ui.showWarningMessage(installMessage ?? localize('funcInstall', 'You must have the "Azure Functions" extension installed to perform this operation.'), { title: 'Install', stepName: 'installFunctions' });
    const commandToRun: string = 'extension.open';
    void commands.executeCommand(commandToRun, funcExtensionId);

    // we still need to throw an error even if the user installs
    throw new UserCancelledError('postInstallFunctions');
}

export async function getGitApi(): Promise<IGit> {
    try {
        // if there is no remote repo state, then try to get the local git api
        if (!ext.remoteRepoApi.state) {
            if (!ext.vscodeGitApi) {
                const gitExtension: GitExtension | undefined = await apiUtils.getExtensionExports('vscode.git');
                if (gitExtension) {
                    const api = gitExtension.getAPI(1);
                    ext.vscodeGitApi = api;
                } else
                    throw new Error(localize('unableGit', 'Unable to retrieve VS Code Git API. Please ensure git is properly installed and reload VS Code.'));
            }

            return ext.vscodeGitApi;
        }
        else {
            return ext.remoteRepoApi;
        }
    } catch (err) {
        // if there is no local git, but remote repo is installed, then use that
        if (await getApiExport(remoteRepositoriesId)) {
            return ext.remoteRepoApi;
        } else if (!getWorkspaceSetting<boolean>('enabled', undefined, 'git')) {
            // the getExtension error is very vague and unactionable so throw our own error if git isn't enabled
            throw new Error(localize('gitEnabled', 'If you would like to use git features, please enable git in your [settings](command:workbench.action.openSettings?%5B%22git.enabled%22%5D). To learn more about how to use git and source control in VS Code [read our docs](https://aka.ms/vscode-scm).'));
        } else {
            throw err;
        }
    }
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

export async function getResourceGroupsApi(): Promise<AzureHostExtensionApi> {
    const rgApiProvider = await getApiExport<apiUtils.AzureExtensionApiProvider>('ms-azuretools.vscode-azureresourcegroups');
    if (rgApiProvider) {
        return rgApiProvider.getApi<AzureHostExtensionApi>('0.0.1');
    } else {
        throw new Error(localize('noResourceGroupExt', 'Could not find the Azure Resource Groups extension'));
    }
}
