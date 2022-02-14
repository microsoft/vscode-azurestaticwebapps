/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { IActionContext } from "@microsoft/vscode-azext-utils";
import { Uri, WorkspaceFolder } from "vscode";
import { DetectorResults, NodeDetector } from "../detectors/node/NodeDetector";
import { getSubFolders } from "./workspaceUtils";

export interface FolderDetectionResult extends DetectorResults {
    uri: Uri;
}

export async function detectAppFoldersInWorkspace(context: IActionContext, workspaceFolder: WorkspaceFolder): Promise<FolderDetectionResult[]> {
    const results: (DetectorResults & { uri: Uri })[] = [];

    const subfolders = await getSubFolders(context, workspaceFolder.uri);
    subfolders.push(workspaceFolder.uri);

    const detector = new NodeDetector();
    for (const subfolder of subfolders) {
        const subResult = await detector.detect(subfolder);
        if (subResult) {
            results.push({ uri: subfolder, ...subResult });
        }
    }

    return results;
}
