/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { FoldingRange, Uri } from "vscode";

const foldingRangeMap: { [key: string]: FoldingRange[] } = {}

export function getFoldingRanges(uri: Uri): FoldingRange[] {
    return foldingRangeMap[uri.fsPath];
}

export function setFoldingRanges(uri: Uri, foldingRanges: FoldingRange[]): void {
    foldingRangeMap[uri.fsPath] = foldingRanges;
}
