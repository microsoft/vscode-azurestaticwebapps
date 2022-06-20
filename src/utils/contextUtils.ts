/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

export function matchContextValue(expectedContextValue: RegExp | string, matches: (string | RegExp)[]): boolean {
    if (expectedContextValue instanceof RegExp) {
        return matches.some((match) => {
            if (match instanceof RegExp) {
                return expectedContextValue.toString() === match.toString();
            }
            return expectedContextValue.test(match);
        });
    } else {
        return matches.some((match) => {
            if (match instanceof RegExp) {
                return match.test(expectedContextValue);
            }
            return expectedContextValue === match;
        });
    }
}
