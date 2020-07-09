/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Uri, workspace, WorkspaceConfiguration } from "vscode";
import { ext } from "../extensionVariables";

/**
 * Uses ext.prefix 'staticWebApps' unless otherwise specified
 */
export async function updateWorkspaceSetting<T = string>(section: string, value: T, fsPath: string, prefix: string = ext.prefix): Promise<void> {
    const projectConfiguration: WorkspaceConfiguration = workspace.getConfiguration(prefix, Uri.file(fsPath));
    await projectConfiguration.update(section, value);
}

/**
 * Uses ext.prefix 'staticWebApps' unless otherwise specified
 */
export function getWorkspaceSetting<T>(key: string, fsPath?: string, prefix: string = ext.prefix): T | undefined {
    const projectConfiguration: WorkspaceConfiguration = workspace.getConfiguration(prefix, fsPath ? Uri.file(fsPath) : undefined);
    return projectConfiguration.get<T>(key);
}
