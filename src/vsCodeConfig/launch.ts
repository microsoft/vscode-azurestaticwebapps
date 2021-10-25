/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { DebugConfiguration, workspace, WorkspaceConfiguration, WorkspaceFolder } from "vscode";

const configurationsKey: string = 'configurations';
const launchKey: string = 'launch';
export const launchVersion: string = '0.2.0';

export function getDebugConfigs(folder: WorkspaceFolder): DebugConfiguration[] {
    return getLaunchConfig(folder).get<DebugConfiguration[]>(configurationsKey) || [];
}

function getLaunchConfig(folder: WorkspaceFolder): WorkspaceConfiguration {
    return workspace.getConfiguration(launchKey, folder.uri);
}
