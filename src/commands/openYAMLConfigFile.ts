/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fse from 'fs-extra';
import * as path from 'path';
import { window, workspace } from "vscode";
import { IActionContext } from "vscode-azureextensionui";
import { ext } from "../extensionVariables";
import { EnvironmentTreeItem } from "../tree/EnvironmentTreeItem";
import { StaticWebAppTreeItem } from "../tree/StaticWebAppTreeItem";
import { openUrl } from "../utils/openUrl";
import { getSingleRootFsPath } from '../utils/workspaceUtils';

export async function openYAMLConfigFile(context: IActionContext, node?: StaticWebAppTreeItem | EnvironmentTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<EnvironmentTreeItem>(EnvironmentTreeItem.contextValue, context);
    }

    const defaultHostname: string = node instanceof StaticWebAppTreeItem ? node.defaultHostname : node.parent.defaultHostname;
    const ymlFileName: string = `.github/workflows/azure-static-web-apps-${defaultHostname.split('.')[0]}.yml`;

    if (node instanceof EnvironmentTreeItem && node.inWorkspace) {
        const fsPath: string | undefined = getSingleRootFsPath();
        if (fsPath) {
            const ymlFsPath: string = path.join(fsPath, ymlFileName);
            // if we couldn't find it, then try opening it in GitHub
            if (await fse.pathExists(ymlFsPath)) {
                await window.showTextDocument(await workspace.openTextDocument(ymlFsPath));
                return;
            }
        }
    }

    await openUrl(`${node.repositoryUrl}/edit/${node.branch}/${ymlFileName}`);
}
