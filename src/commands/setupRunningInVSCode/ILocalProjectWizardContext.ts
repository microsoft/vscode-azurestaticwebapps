/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { WorkspaceFolder } from "vscode";
import { IActionContext } from "vscode-azureextensionui";
import { IBuildPreset } from "../../buildPresets/IBuildPreset";
import { StaticWebAppsCliConfig, StaticWebAppsCliConfigFile } from "../../cli/tryGetStaticWebAppsCliConfig";

export interface ILocalProjectWizardContext extends IActionContext {
    appLocation?: string;
    apiLocation?: string;
    // Function projects detected via host.json at SWA create time
    detectedApiLocations?: string[];
    fsPath?: string;
    swaCliConfigFile?: StaticWebAppsCliConfigFile;
    swaCliConfig?: StaticWebAppsCliConfig;

    // prefill the input boxes with preset build values;
    // projects are too flexible for us to force users to use these values
    buildPreset?: IBuildPreset;

    runCommand?: string;
    workspaceFolder?: WorkspaceFolder;
}
