/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { nonNullValue } from "@microsoft/vscode-azext-utils";
import { CancellationToken, commands, FoldingRange, TextDocument, TextDocumentContentProvider, Uri, window, workspace } from "vscode";
import { ext } from '../../../extensionVariables';
import { JobTreeItem } from "../../../tree/JobTreeItem";
import { StepTreeItem } from "../../../tree/StepTreeItem";

export const contentScheme: string = 'github-action-log';

let _cachedContentProvider: GitHubLogContentProvider | undefined;
function getContentProvider(): GitHubLogContentProvider {
    if (!_cachedContentProvider) {
        _cachedContentProvider = new GitHubLogContentProvider();
        ext.context.subscriptions.push(workspace.registerTextDocumentContentProvider(contentScheme, _cachedContentProvider));
    }
    return _cachedContentProvider;
}

export function getGitHubLogFoldingRanges(document: TextDocument): FoldingRange[] {
    const contentProvider = getContentProvider();
    return contentProvider.getGitHubLogFoldingRanges(document.uri);

}

export async function openGitHubLogContent(node: JobTreeItem | StepTreeItem, content: string, foldingRanges: FoldingRange[]): Promise<GitHubLogContent> {
    const contentProvider = getContentProvider();
    return await contentProvider.openGitHubLogContent(node, content, foldingRanges);
}

export class GitHubLogContent {
    private _content: string;
    private _foldingRanges: FoldingRange[]

    constructor(content: string, foldingRanges: FoldingRange[]) {
        this._content = content;
        this._foldingRanges = foldingRanges;
    }

    public get content(): string {
        return this._content;
    }

    public get foldingRanges(): FoldingRange[] {
        return this._foldingRanges;
    }

}

class GitHubLogContentProvider implements TextDocumentContentProvider {
    private _contentMap: Map<string, GitHubLogContent> = new Map<string, GitHubLogContent>();

    public async openGitHubLogContent(node: JobTreeItem | StepTreeItem, content: string, foldingRanges: FoldingRange[]): Promise<GitHubLogContent> {
        // Remove special characters which may prove troublesome when parsing the uri. We'll allow the same set as `encodeUriComponent`
        const removeSpecialCharRegExp: RegExp = /[^a-z0-9\-\_\.\!\~\*\'\(\)]/gi;
        // the job id is a unique number identifier, but step id is a non-unique integer so include job id as well
        const id: string = (node instanceof JobTreeItem ? node.id : `${node.parent.id}_${node.id}`).replace(removeSpecialCharRegExp, '_');
        const fileName = node.label.replace(removeSpecialCharRegExp, '_');
        const uri: Uri = Uri.parse(`${contentScheme}:///${id}/${fileName}.log`);

        const gitHubLogContent: GitHubLogContent = new GitHubLogContent(content, foldingRanges);
        this._contentMap.set(uri.toString(), gitHubLogContent);

        await window.showTextDocument(uri);
        await commands.executeCommand('editor.foldAll', uri);

        return gitHubLogContent;
    }

    public async provideTextDocumentContent(uri: Uri, _token: CancellationToken): Promise<string> {
        const gitHubLogContent: GitHubLogContent = nonNullValue(this._contentMap.get(uri.toString()), 'GitHubLogContentProvider._contentMap.get');
        return gitHubLogContent.content;
    }

    public getGitHubLogFoldingRanges(uri: Uri): FoldingRange[] {
        const gitHubLogContent: GitHubLogContent | undefined = this._contentMap.get(uri.toString());
        return gitHubLogContent?.foldingRanges || [];
    }
}
