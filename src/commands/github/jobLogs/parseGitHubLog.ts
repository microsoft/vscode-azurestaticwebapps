/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { isEndGroup, isStartGroup } from "../../../constants";

export type LogState = {
    withinGroup: boolean,
    overlappingEntries: boolean,
    filteredJobsLog: string[],
    startFoldingIndices: number[],
    endFoldingIndices: number[],
    firstIndex: number
}

export function parseGitHubLog(rawLogs: string, startedAt: Date, completedAt: Date): LogState {
    const linesArray = rawLogs.split('\r\n');
    const state: LogState = {
        withinGroup: false,
        overlappingEntries: false,
        filteredJobsLog: [],
        startFoldingIndices: [],
        endFoldingIndices: [],
        firstIndex: 0
    };

    for (let i = 0; i < linesArray.length; i++) {
        const entry = linesArray[i];
        const currentTimestamp: Date | undefined = isValidTimestamp(entry, startedAt, completedAt);

        if (!currentTimestamp && !state.withinGroup) {
            continue;
        }

        if (isOverlappingStep(entry, state)) {
            continue;
        }

        pushFoldingIndex(entry, i, state);
        isWithinGroup(entry, state, !!currentTimestamp);
        if (shouldPushStep(state, !!currentTimestamp)) {
            if (state.firstIndex === 0) {
                state.firstIndex = i;
            }

            state.filteredJobsLog.push(cleanLogDecorators(entry));
        }


        if (currentTimestamp && currentTimestamp > completedAt && !state.withinGroup) {
            // only exit filter if we aren't within a group and we are past the last completed_at entry
            break;
        }
    }

    return state;
}

// if the timestamp is invalid or out of the started_at and completed_at range, it will return undefined
// otherwise return the timestamp as a Date
function isValidTimestamp(entry: string, startedAt: Date, completedAt: Date): Date | undefined {
    const timestampRegExp = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{7}Z/;
    const timestamp = timestampRegExp.exec(entry);

    // if the timestamp is invalid, try the next entry
    if (timestamp === null) {
        return undefined;
    }

    const currentTimestamp: Date = new Date(timestamp[0]);

    if (currentTimestamp < startedAt) {
        return undefined;
    } else if ((currentTimestamp > startedAt || currentTimestamp === startedAt) &&
        (currentTimestamp < completedAt || currentTimestamp === completedAt)) {
        return currentTimestamp;
    } else {
        return undefined;
    }

}

function pushFoldingIndex(entry: string, index: number, state: LogState): void {
    if (isStartGroup(entry)) {
        state.startFoldingIndices.push(index);
    } else if (isEndGroup(entry)) {
        state.endFoldingIndices.push(index);
    }
}

function isWithinGroup(entry: string, state: LogState, withinTimestampRange: boolean): void {
    if (state.withinGroup) {
        // if it _is_ an endgroup, then withinGroup should be false
        state.withinGroup = !isEndGroup(entry);
    } else if (withinTimestampRange) {
        // only start a grouping if it is within the time range
        state.withinGroup = isStartGroup(entry);
    }
}

function isOverlappingStep(entry: string, state: LogState): boolean {
    // this should only be accounted for once
    if (!state.overlappingEntries) {
        if (isEndGroup(entry)) {
            if (!state.withinGroup) {
                // the first time we hit an endgroup when not within a group, it's overflow from the previous step so reset state
                state.filteredJobsLog.length = 0;
                state.firstIndex = 0;
                state.overlappingEntries = true;
                return true;
            }
        }
    }

    return false;
}

// some entries in a group are not within the timestamp range but should still be displayed together
function shouldPushStep(state: LogState, withinTimestampRange: boolean): boolean {
    return state.withinGroup || withinTimestampRange;
}

function cleanLogDecorators(entry: string): string {
    const commandRegExp: RegExp = /#{0,2}\[.*\]/;
    // eslint-disable-next-line no-control-regex
    const terminalColorRegExp: RegExp = /\[\d*m/gm;
    return entry.replace(commandRegExp, '').replace(terminalColorRegExp, '');
}

