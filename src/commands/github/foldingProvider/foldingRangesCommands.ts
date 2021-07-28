/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { FoldingRange, FoldingRangeKind } from "vscode";
import { isEndGroup, isStartGroup } from "../../../constants";
import { logState } from "../parseGitHubLog";

export function createFoldingRanges(state: logState): FoldingRange[] {
    const foldingRanges: FoldingRange[] = [];
    for (let i = 0; i < state.startFoldingIndices.length; i++) {
        foldingRanges.push(new FoldingRange(state.startFoldingIndices[i] - state.firstIndex, state.endFoldingIndices[i] - state.firstIndex, FoldingRangeKind.Region));
    }

    return foldingRanges;
}

export function handleFoldingIndex(entry: string, index: number, state: logState): void {
    if (isStartGroup(entry)) {
        state.startFoldingIndices.push(index);
    } else if (isEndGroup(entry)) {
        state.endFoldingIndices.push(index);
    }
}
