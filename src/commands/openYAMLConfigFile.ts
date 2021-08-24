/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { basename } from 'path';
import { Position, Range, TextDocument, Uri, window, workspace } from 'vscode';
import { IActionContext, IAzureQuickPickItem } from "vscode-azureextensionui";
import { CST, Document, parseDocument } from 'yaml';
import { Pair, Scalar, YAMLMap, YAMLSeq } from 'yaml/types';
import { ext } from "../extensionVariables";
import { EnvironmentTreeItem } from "../tree/EnvironmentTreeItem";
import { BuildConfig, GitHubConfigGroupTreeItem } from '../tree/GitHubConfigGroupTreeItem';
import { StaticWebAppTreeItem } from "../tree/StaticWebAppTreeItem";
import { localize } from '../utils/localize';
import { openUrl } from "../utils/openUrl";

export async function openYAMLConfigFile(context: IActionContext, node?: StaticWebAppTreeItem | EnvironmentTreeItem | GitHubConfigGroupTreeItem, buildConfigToSelect?: BuildConfig): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<EnvironmentTreeItem>(EnvironmentTreeItem.contextValue, context);
    }

    let yamlFilePath: string | undefined;

    if (node instanceof GitHubConfigGroupTreeItem) {
        yamlFilePath = node.yamlFilePath;
    } else if (node instanceof EnvironmentTreeItem && node.gitHubConfigGroupTreeItems.length) {
        const picks: IAzureQuickPickItem<string>[] = node.gitHubConfigGroupTreeItems.map(configNode => {
            return { label: basename(configNode.yamlFilePath), data: configNode.yamlFilePath };
        });

        if (picks.length === 1) {
            yamlFilePath = picks[0].data;
        } else {
            const placeHolder: string = localize('selectGitHubConfig', 'Select the GitHub workflow file to open.');
            yamlFilePath = (await context.ui.showQuickPick(picks, { placeHolder })).data;
        }
    } else {
        const defaultHostname: string = node instanceof StaticWebAppTreeItem ? node.defaultHostname : node.parent.defaultHostname;
        const ymlFileName: string = `.github/workflows/azure-static-web-apps-${defaultHostname.split('.')[0]}.yml`;
        const localYamlFiles: Uri[] = await workspace.findFiles(ymlFileName);

        if (localYamlFiles.length === 1) {
            yamlFilePath = localYamlFiles[0].fsPath;
        } else {
            return await openUrl(`${node.repositoryUrl}/edit/${node.branch}/${ymlFileName}`);
        }
    }

    const configDocument: TextDocument = await workspace.openTextDocument(yamlFilePath);
    const selection: Range | undefined = await tryGetSelection(context, configDocument, buildConfigToSelect, node instanceof GitHubConfigGroupTreeItem ? node : undefined);
    await window.showTextDocument(configDocument, { selection });
}

export async function tryGetSelection(context: IActionContext, configDocument: TextDocument, buildConfigToSelect?: BuildConfig, node?: GitHubConfigGroupTreeItem): Promise<Range | undefined> {
    if (node?.errorRange) {
        return node.errorRange;
    }

    if (!buildConfigToSelect) {
        return undefined;
    }

    const configDocumentText: string = configDocument.getText();
    const buildConfigRegex: RegExp = new RegExp(`${buildConfigToSelect}:`, 'g');
    const buildConfigMatches: RegExpMatchArray | null = configDocumentText.match(buildConfigRegex);

    if (buildConfigMatches && buildConfigMatches.length > 1) {
        void context.ui.showWarningMessage(localize('foundMultipleBuildConfigs', 'Multiple "{0}" workflow files were found in "{1}".', buildConfigToSelect, basename(configDocument.uri.fsPath)));
        return undefined;
    }

    try {
        type YamlNode = YAMLMap | YAMLSeq | Pair | Scalar | undefined | null;
        const yamlNodes: YamlNode[] = [];
        const parsedYaml: Document.Parsed = parseDocument(configDocumentText, { keepCstNodes: true });
        let yamlNode: YamlNode = parsedYaml.contents;

        while (yamlNode) {
            if ('key' in yamlNode && (<Scalar>yamlNode.key).value === buildConfigToSelect && 'value' in yamlNode) {
                const cstNode: CST.Node | undefined = (<Scalar>yamlNode.value)?.cstNode;
                const range = cstNode?.rangeAsLinePos;

                if (range && range.end) {
                    // Range isn't zero-indexed by default
                    range.start.line--;
                    range.start.col--;
                    range.end.line--;
                    range.end.col--;

                    if (cstNode?.comment) {
                        // The end range includes the length of the comment
                        range.end.col -= cstNode.comment.length + 1;

                        const lineText: string = (configDocument.lineAt(range.start.line)).text;

                        // Don't include the comment character
                        if (lineText[range.end.col] === '#') {
                            range.end.col--;
                        }

                        // Don't include any horizontal whitespace between the end of the YAML value and the comment
                        while (/[ \t]/.test(lineText[range.end.col - 1])) {
                            range.end.col--;
                        }
                    }

                    const startPosition: Position = new Position(range.start.line, range.start.col);
                    const endPosition: Position = new Position(range.end.line, range.end.col);
                    return configDocument.validateRange(new Range(startPosition, endPosition));
                }
            } else if ('items' in yamlNode) {
                yamlNodes.push(...yamlNode.items)
            } else if ('value' in yamlNode && typeof yamlNode.value === 'object') {
                yamlNodes.push(yamlNode.value)
            }

            yamlNode = yamlNodes.pop();
        }
    } catch {
        // Ignore errors
    }

    return undefined;
}
