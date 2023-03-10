/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ConfigurationTarget, Uri, workspace, WorkspaceConfiguration } from "vscode";
import { ext } from "../extensionVariables";

/**
 * Uses ext.prefix 'staticWebApps' unless otherwise specified
 */
export async function updateWorkspaceSetting<T = string>(section: string, value: T, uri: Uri, prefix: string = ext.prefix): Promise<void> {
    const projectConfiguration: WorkspaceConfiguration = workspace.getConfiguration(prefix, uri);
    await projectConfiguration.update(section, value);
}

/**
 * Uses ext.prefix 'staticWebApps' unless otherwise specified
 */
export function getWorkspaceSetting<T>(key: string, uri?: Uri, prefix: string = ext.prefix): T | undefined {
    const projectConfiguration: WorkspaceConfiguration = workspace.getConfiguration(prefix, uri);
    return projectConfiguration.get<T>(key);
}

/**
 * Uses ext.prefix 'staticWebApps' unless otherwise specified
 */
export async function updateGlobalSetting<T = string>(section: string, value: T, prefix: string = ext.prefix): Promise<void> {
    const projectConfiguration: WorkspaceConfiguration = workspace.getConfiguration(prefix);
    await projectConfiguration.update(section, value, ConfigurationTarget.Global);
}
