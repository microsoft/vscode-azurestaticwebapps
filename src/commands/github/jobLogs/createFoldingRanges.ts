/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { FoldingRange, FoldingRangeKind } from "vscode";
import { LogState } from "./parseGitHubLog";

export function createFoldingRanges(state: LogState): FoldingRange[] {
    const foldingRanges: FoldingRange[] = [];
    for (let i = 0; i < state.startFoldingIndices.length; i++) {
        // subtract the first index from the folding range to account for starting midway in a log file
        foldingRanges.push(new FoldingRange(state.startFoldingIndices[i] - state.firstIndex, state.endFoldingIndices[i] - state.firstIndex, FoldingRangeKind.Region));
    }

    return foldingRanges;
}

