/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Uri, workspace } from "vscode";
import { AzExtFsExtra } from "vscode-azureextensionui";

export type SWACLIOptions = {
    context?: string;
    port?: number;
    host?: string;
    apiPort?: number;
    ssl?: boolean;
    apiPrefix?: "api";
    sslCert?: string;
    sslKey?: string;
    swaConfigFilename?: "staticwebapp.config.json";
    swaConfigFilenameLegacy?: "routes.json";
    app?: string;
    apiLocation?: string;
    build?: boolean;
    verbose?: string;
    run?: string;
    swaConfigLocation?: string;
    customUrlScheme?: string;
    overridableErrorCode?: number[];
    devserverTimeout?: number;
    funcArgs?: string;
    appBuildCommand?: string;
    apiBuildCommand?: string;
    appLocation?: string;
    outputLocation?: string;
    files?: string[];
};

export interface StaticWebAppsCliConfigFile {
    configurations?: {
        [name: string]: SWACLIOptions;
    }
}

export interface StaticWebAppsCliConfig {
    name: string;
    options: SWACLIOptions;
}

export async function tryGetStaticWebAppsCliConfig(workspaceFolder: Uri): Promise<StaticWebAppsCliConfigFile | undefined> {

    const swaCliConfigFilename = 'swa-cli.config.json';
    const swaCliConfigUri = Uri.joinPath(workspaceFolder, swaCliConfigFilename);

    if (await AzExtFsExtra.pathExists(swaCliConfigUri)) {
        return JSON.parse((await workspace.fs.readFile(Uri.joinPath(workspaceFolder, swaCliConfigFilename))).toString()) as StaticWebAppsCliConfigFile;
    }

    return undefined;
}
