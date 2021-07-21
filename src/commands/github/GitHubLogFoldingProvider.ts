/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken, FoldingContext, FoldingRange, FoldingRangeKind, FoldingRangeProvider, TextDocument } from "vscode";

// const rangeLimit = 5000;

export default class GitHubLogFoldingProvider implements FoldingRangeProvider {

    public async provideFoldingRanges(
        document: TextDocument,
        _: FoldingContext,
        _token: CancellationToken
    ): Promise<FoldingRange[]> {
        return await this.getRegions(document);
    }
    private async getRegions(document: TextDocument): Promise<FoldingRange[]> {
        const foldingRanges: FoldingRange[] = [];
        const startIndices: number[] = [];
        const endIndices: number[] = [];

        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            if (isStartGroup(line.text)) {
                startIndices.push(i);
            } else if (isEndGroup(line.text)) {
                endIndices.push(i);
            }
        }

        for (let i = 0; i < startIndices.length; i++) {
            foldingRanges.push(new FoldingRange(startIndices[i], endIndices[i], FoldingRangeKind.Region));
        }

        return foldingRanges;
    }

}

const isStartGroup = (t: string) => /##\[group\]/.test(t);
const isEndGroup = (t: string) => /##\[endgroup\]/.test(t);




