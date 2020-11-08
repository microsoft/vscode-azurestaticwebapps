/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { workspace } from 'vscode';
import { IActionContext } from "vscode-azureextensionui";
import { apiSubpathSetting, defaultApiLocation } from '../constants';
import { getFunctionsApi } from '../getExtensionApi';
import { localize } from '../utils/localize';
import { getWorkspaceSetting } from '../utils/settingsUtils';
import { AzureFunctionsExtensionApi } from '../vscode-azurefunctions.api';

export async function createHttpFunction(context: IActionContext): Promise<void> {
    if (!workspace.workspaceFolders || workspace.workspaceFolders.length <= 0) {
        const noWorkspaceError: string = localize('noWorkspace', 'This action cannot be completed because there is no workspace opened.  Please open a workspace.');
        context.errorHandling.suppressReportIssue = true;
        throw new Error(noWorkspaceError);
    }

    const funcApi: AzureFunctionsExtensionApi = await getFunctionsApi(context);

    const apiLocation: string = getWorkspaceSetting(apiSubpathSetting, workspace.workspaceFolders[0].uri.fsPath) || defaultApiLocation;
    const folderPath: string = path.join(workspace.workspaceFolders[0].uri.fsPath, apiLocation);

    await funcApi.createFunction({
        folderPath,
        suppressCreateProjectPrompt: true,
        templateId: 'HttpTrigger',
        languageFilter: /Python|C\#|^(Java|Type)Script$/i,
        functionSettings: { authLevel: 'anonymous' }
    });
}
