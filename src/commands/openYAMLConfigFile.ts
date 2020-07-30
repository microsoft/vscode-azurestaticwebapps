/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Uri, window, workspace } from "vscode";
import { IActionContext } from "vscode-azureextensionui";
import { ext } from "../extensionVariables";
import { EnvironmentTreeItem } from "../tree/EnvironmentTreeItem";
import { StaticWebAppTreeItem } from "../tree/StaticWebAppTreeItem";
import { openUrl } from "../utils/openUrl";

export async function openYAMLConfigFile(context: IActionContext, node?: StaticWebAppTreeItem | EnvironmentTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<EnvironmentTreeItem>(EnvironmentTreeItem.contextValue, context);
    }

    const defaultHostname: string = node instanceof StaticWebAppTreeItem ? node.data.properties.defaultHostname : node.parent.data.properties.defaultHostname;
    const ymlFileName: string = `.github/workflows/azure-static-web-apps-${defaultHostname.replace('.azurestaticapps.net', '')}.yml`;

    if (node instanceof EnvironmentTreeItem && node.inWorkspace) {
        const ymlUri: Uri[] = await workspace.findFiles(ymlFileName);
        // if we couldn't find it, then try opening it in GitHub
        if (ymlUri.length > 0) {
            await window.showTextDocument(await workspace.openTextDocument(ymlUri[0]));
            return;
        }
    }

    await openUrl(`${node.repositoryUrl}/edit/${node.branch}/.github/workflows/azure-static-web-apps-${defaultHostname.replace('.azurestaticapps.net', '')}.yml`);
}
