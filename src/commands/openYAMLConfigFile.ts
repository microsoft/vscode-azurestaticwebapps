/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fse from 'fs-extra';
import * as path from 'path';
import { Position, Range, TextDocument, window, workspace } from "vscode";
import { IActionContext } from "vscode-azureextensionui";
import { ext } from "../extensionVariables";
import { EnvironmentTreeItem } from "../tree/EnvironmentTreeItem";
import { BuildConfig } from '../tree/localProject/ConfigGroupTreeItem';
import { StaticWebAppTreeItem } from "../tree/StaticWebAppTreeItem";
import { getYAMLFileName } from '../utils/gitHubUtils';
import { openUrl } from "../utils/openUrl";
import { getSingleRootFsPath } from '../utils/workspaceUtils';

export async function openYAMLConfigFile(context: IActionContext, node?: StaticWebAppTreeItem | EnvironmentTreeItem, buildConfigToSelect?: BuildConfig): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<EnvironmentTreeItem>(EnvironmentTreeItem.contextValue, context);
    }

    const ymlFileName: string = getYAMLFileName(node);

    if (node instanceof EnvironmentTreeItem && node.inWorkspace) {
        const fsPath: string | undefined = getSingleRootFsPath();
        if (fsPath) {
            const ymlFsPath: string = path.join(fsPath, ymlFileName);
            // if we couldn't find it, then try opening it in GitHub
            if (await fse.pathExists(ymlFsPath)) {
                const configDocument: TextDocument = await workspace.openTextDocument(ymlFsPath);
                const selection: Range | undefined = await getSelection(configDocument, buildConfigToSelect);
                await window.showTextDocument(configDocument, { selection });
                return;
            }
        }
    }

    await openUrl(`${node.repositoryUrl}/edit/${node.branch}/${ymlFileName}`);
}

async function getSelection(configDocument: TextDocument, buildConfigToSelect?: BuildConfig): Promise<Range | undefined> {
    if (buildConfigToSelect) {
        const configRegex: RegExp = new RegExp(`${buildConfigToSelect}:`);

        let offset: number = configDocument.getText().search(configRegex);
        // Shift the offset to the beginning of the build config's value
        offset += `${buildConfigToSelect}: `.length;

        const position: Position = configDocument.positionAt(offset);
        const configValueRegex: RegExp = /['"].*['"]/;
        return configDocument.getWordRangeAtPosition(position, configValueRegex);
    }

    return undefined;
}
