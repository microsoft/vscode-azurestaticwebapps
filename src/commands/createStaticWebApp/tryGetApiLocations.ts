/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fse from 'fs-extra';
import * as path from 'path';
import { RelativePattern, workspace, WorkspaceFolder } from "vscode";
import { IActionContext } from "vscode-azureextensionui";
import { telemetryUtils } from '../../utils/telemetryUtils';

const hostFileName: string = 'host.json';

/**
 * Checks root folder and one level down first, then all levels of tree
 * If a single function project is found, returns that path.
 * If multiple projects are found, will prompt
 * @param workspaceFolder Per the VS Code docs for `findFiles`: It is recommended to pass in a workspace folder if the pattern should match inside the workspace.
 */
export async function tryGetApiLocations(context: IActionContext, workspaceFolder: WorkspaceFolder | string): Promise<string[] | undefined> {
    return await telemetryUtils.runWithDurationTelemetry(context, 'tryGetProject', async () => {
        const folderPath = typeof workspaceFolder === 'string' ? workspaceFolder : workspaceFolder.uri.fsPath;
        if (await fse.pathExists(folderPath)) {
            if (await isFunctionProject(folderPath)) {
                return [folderPath];
            } else {
                const hostJsonUris = await workspace.findFiles(new RelativePattern(workspaceFolder, `*/${hostFileName}`));
                if (hostJsonUris.length !== 1) {
                    // NOTE: If we found a single project at the root or one level down, we will use that without searching any further.
                    // This will reduce false positives in the case of compiled languages like C# where a 'host.json' file is often copied to a build/publish directory a few levels down
                    // It also maintains consistent historical behavior by giving that project priority because we used to _only_ look at the root and one level down
                    hostJsonUris.push(...await workspace.findFiles(new RelativePattern(workspaceFolder, `*/*/**/${hostFileName}`)));
                }

                const projectPaths = hostJsonUris.map(uri => path.relative(folderPath, path.dirname(uri.fsPath)));
                return projectPaths;
            }
        }

        return undefined;
    });
}

// Use 'host.json' as an indicator that this is a functions project
async function isFunctionProject(folderPath: string): Promise<boolean> {
    return await fse.pathExists(path.join(folderPath, hostFileName));
}
