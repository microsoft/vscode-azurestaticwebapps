/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

/**
 * Get a string in the `#m #s` format. E.g. `2m 34s`.
 *
 * @param start Starting Date
 * @param end Ending Date
 *
 * **NOTE:** If the difference between `start` and `end` is negative, `end` will be treated as the current time.
 */
// tslint:disable-next-line: export-name
export function getTimeElapsedString(start: Date, end: Date): string {
    const deltaMs: number = (end.getTime() - start.getTime()) / 1000;

    if (deltaMs < 0) {
        const now: Date = new Date();
        now.setMilliseconds(0);
        return getTimeElapsedString(start, now);
    }

    if (deltaMs > 59) {
        const minutes: number = Math.floor(deltaMs / 60);
        const seconds: number = deltaMs - minutes * 60;
        return `${minutes}m ${seconds}s`;
    } else {
        return `${deltaMs}s`;
    }
}
