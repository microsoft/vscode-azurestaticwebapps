/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra, parseError } from "@microsoft/vscode-azext-utils";
import { Uri } from "vscode";
import { swaCliConfigFileName } from "../constants";
import { localize } from "../utils/localize";

export type SWACLIStartOptions = {
    appLocation?: string;
    outputLocation?: string;
    apiLocation?: string;
    appDevserverUrl?: string;
    apiDevserverUrl?: string;
    apiPort?: number;
    host?: string;
    port?: number;
    ssl?: boolean;
    sslCert?: string;
    sslKey?: string;
    run?: string;
    devserverTimeout?: number;
    open?: boolean;
    funcArgs?: string;
    githubActionWorkflowLocation?: string;
    swaConfigLocation?: string;
};

export type SWACLIOptions = {
    apiLocation?: string;
    appLocation?: string;
    apiDevserverUrl?: string;
    appDevserverUrl?: string;
    run?: string;
    devserverTimeout?: number;
    open?: boolean;
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
