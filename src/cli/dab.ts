/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as path from "path";
import * as vscode from "vscode";
import { RelativePattern } from "vscode";

/**
 * Searches the given workspace folder for a `staticwebapp.database.config.json` file 1 level deep.
 * If found, the path of the containing directory is returned.
 *
 * @param workspaceFolder - workspace folder to search
 * @returns `string` path of the **directory** holding the db config file or `undefined` if no db config file is found.
 */
export async function getFolderContainingDbConfigFile(workspaceFolder: vscode.WorkspaceFolder): Promise<string | undefined> {
    // Folder that holds the staticwebapp.database.config.json file must be at the root of the static web apps repository.
    // See https://learn.microsoft.com/en-us/azure/static-web-apps/database-configuration#custom-configuration-folder
    const include = new RelativePattern(workspaceFolder, `*/staticwebapp.database.config.json`);
    const results = await vscode.workspace.findFiles(include, '**/node_modules/**', 1);
    // SWA CLI command wants the path to the directory containing the file, not the path of the actual file
    return results[0] ? path.dirname(results[0]?.path) : undefined;
}
