/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { basename } from 'path';
import { Position, Range, TextDocument, window, workspace } from "vscode";
import { IActionContext, IAzureQuickPickItem } from "vscode-azureextensionui";
import { ext } from "../extensionVariables";
import { EnvironmentTreeItem } from "../tree/EnvironmentTreeItem";
import { BuildConfig, GitHubConfigGroupTreeItem } from '../tree/localProject/ConfigGroupTreeItem';
import { StaticWebAppTreeItem } from "../tree/StaticWebAppTreeItem";
import { localize } from '../utils/localize';
import { openUrl } from "../utils/openUrl";

export async function openYAMLConfigFile(context: IActionContext, node?: StaticWebAppTreeItem | EnvironmentTreeItem | GitHubConfigGroupTreeItem, buildConfigToSelect?: BuildConfig): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<EnvironmentTreeItem>(EnvironmentTreeItem.contextValue, context);
    }

    if (node instanceof StaticWebAppTreeItem || node instanceof EnvironmentTreeItem && node.gitHubConfigGroupTreeItems.length === 0) {
        const defaultHostname: string = node instanceof StaticWebAppTreeItem ? node.defaultHostname : node.parent.defaultHostname;
        const ymlFileName: string = `.github/workflows/azure-static-web-apps-${defaultHostname.split('.')[0]}.yml`;
        return await openUrl(`${node.repositoryUrl}/edit/${node.branch}/${ymlFileName}`);
    }

    let yamlFilePath: string | undefined;
    if (node instanceof GitHubConfigGroupTreeItem ){
        yamlFilePath = node.yamlFilePath;
    } else {
        const picks: IAzureQuickPickItem<string>[] = node.gitHubConfigGroupTreeItems.map(configNode => {
            return { label: basename(configNode.yamlFilePath), data: configNode.yamlFilePath };
        });

        if (picks.length === 1) {
            yamlFilePath = picks[0].data;
        } else {
            const placeHolder: string = localize('selectGitHubConfig', 'Select the GitHub configuration file to open.');
            yamlFilePath = (await ext.ui.showQuickPick(picks, { placeHolder })).data;
        }
    }

    const configDocument: TextDocument = await workspace.openTextDocument(yamlFilePath);
    const selection: Range | undefined = buildConfigToSelect ? await getSelection(configDocument, buildConfigToSelect) : undefined;
    await window.showTextDocument(configDocument, { selection });
}

async function getSelection(configDocument: TextDocument, buildConfigToSelect: BuildConfig): Promise<Range | undefined> {
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
