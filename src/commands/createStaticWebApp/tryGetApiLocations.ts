/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra, IActionContext } from "@microsoft/vscode-azext-utils";
import * as path from 'path';
import { RelativePattern, WorkspaceFolder, workspace } from "vscode";
import { URI, Utils } from "vscode-uri";
import { localize } from '../../utils/localize';
import { telemetryUtils } from '../../utils/telemetryUtils';

const hostFileName: string = 'host.json';

/**
 * Checks root folder and one level down first, then all levels of tree
 * If a single function project is found, returns that path.
 * If multiple projects are found, will prompt
 * @param workspaceFolder Per the VS Code docs for `findFiles`: It is recommended to pass in a workspace folder if the pattern should match inside the workspace.
 * @param shallow Search at the root, and on level down only.
 */
export async function tryGetApiLocations(context: IActionContext, workspaceFolder: WorkspaceFolder | string, shallow?: boolean): Promise<string[] | undefined> {
    return await telemetryUtils.runWithDurationTelemetry(context, 'tryGetProject', async () => {
        context.telemetry.properties.shallow = shallow ? 'true' : 'false';
        const folderPath = typeof workspaceFolder === 'string' ? workspaceFolder : workspaceFolder.uri.fsPath;
        if (await AzExtFsExtra.pathExists(folderPath)) {
            if (await isFunctionProject(folderPath)) {
                return [folderPath];
            } else {
                const hostJsonUris = await workspace.findFiles(new RelativePattern(workspaceFolder, `*/${hostFileName}`));
                if (hostJsonUris.length !== 1 && !shallow) {
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

export async function promptForApiFolder(context: IActionContext, detectedApiLocations: string[]): Promise<string> {
    if (detectedApiLocations.length === 1) {
        return detectedApiLocations[0];
    }

    return (await context.ui.showQuickPick(detectedApiLocations.map((apiPaths) => ({ label: apiPaths })), {
        placeHolder: localize('selectApi', 'Select the location of your Azure Functions code')
    })).label;
}

// Use 'host.json' as an indicator that this is a functions project
async function isFunctionProject(folderPath: string): Promise<boolean> {
    return await AzExtFsExtra.pathExists(Utils.joinPath(URI.parse(folderPath), hostFileName));
}
