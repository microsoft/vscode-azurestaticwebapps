/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { EOL } from 'os';
import { basename } from 'path';
import { Range, TextDocument, window, workspace } from "vscode";
import { IActionContext, IAzureQuickPickItem } from "vscode-azureextensionui";
import { Document, parseDocument } from 'yaml';
import { Pair, Scalar, YAMLMap, YAMLSeq } from 'yaml/types';
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
            const placeHolder: string = localize('selectGitHubConfig', 'Select the GitHub workflow file to open.');
            yamlFilePath = (await ext.ui.showQuickPick(picks, { placeHolder })).data;
        }
    }

    const configDocument: TextDocument = await workspace.openTextDocument(yamlFilePath);
    const selection: Range | undefined = buildConfigToSelect ? await getSelection(configDocument, buildConfigToSelect) : undefined;
    await window.showTextDocument(configDocument, { selection });
}

/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, no-prototype-builtins, @typescript-eslint/no-unsafe-assignment */
export async function getSelection(configDocument: TextDocument, buildConfigToSelect: BuildConfig): Promise<Range | undefined> {
    const configDocumentText: string = configDocument.getText();
    const buildConfigRegex: RegExp = new RegExp(`${buildConfigToSelect}:`, 'g');
    const buildConfigMatches: RegExpMatchArray | null = configDocumentText.match(buildConfigRegex);

    if (buildConfigMatches && buildConfigMatches.length > 1) {
        void ext.ui.showWarningMessage(localize('foundMultipleBuildConfigs', 'Multiple "{0}" build configurations were found in "{1}".', buildConfigToSelect, basename(configDocument.uri.fsPath)));
        return undefined;
    }

    const parsedYaml: Document.Parsed = parseDocument(configDocumentText);
    type YamlNode = YAMLMap | YAMLSeq | Pair | undefined;
    const yamlNodes: YamlNode[] = [];
    let yamlNode: YamlNode = parsedYaml.get('jobs');

    while (yamlNode) {
        if (yamlNode.hasOwnProperty('key') && yamlNode['key'].value === buildConfigToSelect && yamlNode.hasOwnProperty('value')) {
            const configValue = <Scalar>yamlNode['value'];
            const range = <number[] | undefined>configValue.range;

            if (range) {
                const buildConfigOffset: number = configDocumentText.search(buildConfigRegex);
                let newlines: number = 0;

                // The range returned from the `yaml` package doesn't include newlines
                // So count newlines and include them in the range we return
                for (const char of configDocumentText.slice(0, buildConfigOffset)) {
                    newlines += char === EOL ? 1 : 0;
                }

                const startOffset = range[0] + newlines;
                let endOffset = range[1] + newlines;

                if (configValue.comment) {
                    // `endOffset` by default includes the length of the comment
                    endOffset -= configValue.comment.length + 1;

                    // Don't include the comment character
                    if (configDocumentText[endOffset] === '#') {
                        endOffset--;
                    }

                    // Don't include any horizontal whitespace between the end of the YAML value and the comment
                    while (/[ \t]/.test(configDocumentText[endOffset - 1])) {
                        endOffset--;
                    }
                }

                const startPosition = configDocument.positionAt(startOffset);
                const endPosition = configDocument.positionAt(endOffset);
                return new Range(startPosition, endPosition);
            }
        } else if (yamlNode.hasOwnProperty('items')) {
            yamlNodes.push(...yamlNode['items'])
        } else if (yamlNode.hasOwnProperty('value') && yamlNode['value'].hasOwnProperty('items')) {
            yamlNodes.push(...yamlNode['value']['items'])
        }

        yamlNode = yamlNodes.pop();
    }

    return undefined;
}
