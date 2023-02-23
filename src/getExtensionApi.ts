/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext, UserCancelledError } from "@microsoft/vscode-azext-utils";
import { AzureHostExtensionApi } from "@microsoft/vscode-azext-utils/hostapi";
import { apiUtils } from '@microsoft/vscode-azureresources-api';
import { Extension, commands, extensions } from "vscode";
import { AzureExtensionApiProvider } from "../azext-utils-api";
import { ext } from "./extensionVariables";
import { API, GitExtension } from "./git";
import { localize } from "./utils/localize";
import { getWorkspaceSetting } from "./utils/settingsUtils";
import { AzureFunctionsExtensionApi } from "./vscode-azurefunctions.api";


/**
 * @param installMessage Override default message shown if extension is not installed.
 */
export async function getFunctionsApi(context: IActionContext, installMessage?: string): Promise<AzureFunctionsExtensionApi> {
    const funcExtensionId: string = 'ms-azuretools.vscode-azurefunctions';
    const funcExtension: AzureExtensionApiProvider | undefined = await apiUtils.getExtensionExports(funcExtensionId);

    if (funcExtension) {
        return funcExtension.getApi<AzureFunctionsExtensionApi>('^1.7.0');
    }

    await context.ui.showWarningMessage(installMessage ?? localize('funcInstall', 'You must have the "Azure Functions" extension installed to perform this operation.'), { title: 'Install', stepName: 'installFunctions' });
    const commandToRun: string = 'extension.open';
    void commands.executeCommand(commandToRun, funcExtensionId);

    // we still need to throw an error even if the user installs
    throw new UserCancelledError('postInstallFunctions');
}

export async function getGitApi(): Promise<API> {
    // this is where we would have a split in logic
    // check if there is a remote repo opened (this can be in web or desktop)
    // if not, then we can check if there is a local repo opened
    // if we have access to git, we should use this method

    // how to refactor?
    // we could either have two totally separate methods or select the logic based on the context
    // having separate methods might be a little cleaner, but it would be a lot of duplicated code

    // I think Git API and Remote Hubs should have the same API so just determined which to use
    // Things to check:
    // Can I have a remote opened with a local repo?
    // Should I switch everything to API calls instead of using local git?
    // What happens if I have multiple repos open?

    try {
        if (!ext.gitApi.state) {
            const gitExtension: GitExtension | undefined = await apiUtils.getExtensionExports('vscode.git');
            if (gitExtension) {
                const api = gitExtension.getAPI(1);
                return api;

            } else {
                throw new Error(localize('unableGit', 'Unable to retrieve VS Code Git API. Please ensure git is properly installed and reload VS Code.'));
            }
        } else {
            return ext.gitApi;
        }
    } catch (err) {
        if (!getWorkspaceSetting<boolean>('enabled', undefined, 'git')) {
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
    const rgApiProvider = await getApiExport<AzureExtensionApiProvider>('ms-azuretools.vscode-azureresourcegroups');
    if (rgApiProvider) {
        return rgApiProvider.getApi<AzureHostExtensionApi>('0.0.1');
    } else {
        throw new Error(localize('noResourceGroupExt', 'Could not find the Azure Resource Groups extension'));
    }
}
