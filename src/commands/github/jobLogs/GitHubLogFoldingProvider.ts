/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken, FoldingContext, FoldingRange, FoldingRangeProvider, TextDocument } from "vscode";
import { getGitHubLogFoldingRanges } from "./GitHubLogContentProvider";

export default class GitHubLogFoldingProvider implements FoldingRangeProvider {

    public async provideFoldingRanges(document: TextDocument, _context: FoldingContext, _token: CancellationToken): Promise<FoldingRange[]> {
        return getGitHubLogFoldingRanges(document);
    }
}
