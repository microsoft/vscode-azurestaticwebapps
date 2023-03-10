/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext } from "@microsoft/vscode-azext-utils";
import * as path from 'path';
import { workspace } from 'vscode';
import { apiSubpathSetting, defaultApiLocation } from '../constants';
import { getFunctionsApi } from '../getExtensionApi';
import { localize } from '../utils/localize';
import { getWorkspaceSetting } from '../utils/settingsUtils';
import { AzureFunctionsExtensionApi } from '../vscode-azurefunctions.api';
import { promptForApiFolder, tryGetApiLocations } from './createStaticWebApp/tryGetApiLocations';

export async function createHttpFunction(context: IActionContext): Promise<void> {
    if (!workspace.workspaceFolders || workspace.workspaceFolders.length <= 0) {
        const noWorkspaceError: string = localize('noWorkspace', 'This action cannot be completed because there is no workspace opened.  Please open a workspace.');
        context.errorHandling.suppressReportIssue = true;
        throw new Error(noWorkspaceError);
    }

    const detectedApiLocations = await tryGetApiLocations(context, workspace.workspaceFolders[0].uri.fsPath);

    const apiLocation: string = detectedApiLocations?.length ?
        await promptForApiFolder(context, detectedApiLocations) :
        getWorkspaceSetting(apiSubpathSetting, workspace.workspaceFolders[0].uri) || defaultApiLocation;
    const folderPath: string = path.join(workspace.workspaceFolders[0].uri.fsPath, apiLocation);

    const funcApi: AzureFunctionsExtensionApi = await getFunctionsApi(context);
    await funcApi.createFunction({
        folderPath,
        suppressCreateProjectPrompt: true,
        templateId: 'HttpTrigger',
        languageFilter: /Python|C\#|^(Java|Type)Script$/i,
        functionSettings: { authLevel: 'anonymous' },
        targetFramework: ['net6.0', 'net7.0'] // Will only work on functions api v1.4.0, but won't hurt on v1.3.0
    });
}
