/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { EOL } from 'os';
import { IActionContext, openReadOnlyContent } from 'vscode-azureextensionui';
import { ext } from '../../extensionVariables';
import { JobLogEntry, JobTreeItem } from '../../tree/JobTreeItem';
import { StepTreeItem } from '../../tree/StepTreeItem';

export async function openActionLog(context: IActionContext, node?: StepTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<StepTreeItem>(StepTreeItem.contextValue, context);
    }

    let jobLogs: JobLogEntry[];

    if (node instanceof JobTreeItem) {
        jobLogs = await node.getJobLogs(context);
    } else {
        const test = await node.parent.getJobLogs(context);
        jobLogs = filterByStepLog(test, new Date(node.data.started_at), new Date(node.data.completed_at));
    }

    await openReadOnlyContent(node, jobLogs.map((entry) => entry.timestamp + ': ' + entry.line).join(EOL), '.log');

}

function filterByStepLog(jobsLog: JobLogEntry[], startedAt: Date, completedAt: Date): JobLogEntry[] {
    const group: RegExp = /##\[group\]/;
    const endGroup: RegExp = /##\[endgroup\]/;

    let withinGroup: boolean = false;
    let overlappingEntries: boolean = false;

    const filteredJobsLog: JobLogEntry[] = [];

    for (let i = 0; i < jobsLog.length; i++) {
        const entry = jobsLog[i];
        const currentTimestamp = new Date(entry.timestamp);
        const newEntry = { timestamp: entry.timestamp, line: entry.line };
        const withinTimestampRange: boolean = (currentTimestamp > startedAt || currentTimestamp === startedAt) &&
            (currentTimestamp < completedAt || currentTimestamp === completedAt);

        if (withinGroup || (!overlappingEntries && withinTimestampRange)) {
            if (endGroup.test(newEntry.line)) {
                if (!overlappingEntries && !withinGroup) {
                    // if we hit an endgroup before we are within a group, then this is overflow from the last step
                    filteredJobsLog.length = 0;
                    overlappingEntries = true;
                    continue;
                } else {
                    withinGroup = false;
                }
            }
        }

        if (withinGroup) {
            filteredJobsLog.push(newEntry);
        } else if (withinTimestampRange) {
            if (group.test(newEntry.line)) {
                withinGroup = true;
            }

            filteredJobsLog.push(newEntry)
        }

        // groups have a higher precedence than timestamps-- this is how GitHub displays it
        if (currentTimestamp > completedAt && !withinGroup) {
            break;
        }
    }

    return filteredJobsLog;
}
