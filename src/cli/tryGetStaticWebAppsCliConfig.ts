/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra, parseError } from "@microsoft/vscode-azext-utils";
import { Uri } from "vscode";
import { swaCliConfigFileName } from "../constants";
import { localize } from "../utils/localize";

export type SWACLIOptions = {
    context?: string;
    /**
     * Directory the DAB configuration file is in
     */
    dataApiLocation?: string;
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
    const swaCliConfigUri = Uri.joinPath(workspaceFolder, swaCliConfigFileName);

    if (await AzExtFsExtra.pathExists(swaCliConfigUri)) {
        try {
            return JSON.parse(await AzExtFsExtra.readFile(Uri.joinPath(workspaceFolder, swaCliConfigFileName))) as StaticWebAppsCliConfigFile;
        } catch (e) {
            throw new Error(localize('failedReadSwaCliConfig', 'Error reading swa-cli.config.json file: {0}', parseError(e).message));
        }
    }

    return undefined;
}
