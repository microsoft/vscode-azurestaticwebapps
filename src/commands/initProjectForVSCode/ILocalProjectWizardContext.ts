/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { WorkspaceFolder } from "vscode";
import { IActionContext } from "vscode-azureextensionui";
import { StaticWebAppsCliConfig, StaticWebAppsCliConfigFile } from "../../cli/tryGetStaticWebAppsCliConfig";

export interface ILocalProjectWizardContext extends IActionContext {
    appLocation?: string;
    apiLocation?: string;
    detectedApiLocations?: string[];
    fsPath?: string;
    workspaceFolder?: WorkspaceFolder;
    swaCliConfigFile?: StaticWebAppsCliConfigFile;
    swaCliConfig?: StaticWebAppsCliConfig;
}
