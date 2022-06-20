/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext, parseError } from '@microsoft/vscode-azext-utils';
import { EOL } from 'os';
import { FoldingRange } from 'vscode';
import { swaFilter } from '../../../constants';
import { ext } from '../../../extensionVariables';
import { JobTreeItem } from '../../../tree/JobTreeItem';
import { StepTreeItem } from '../../../tree/StepTreeItem';
import { localize } from '../../../utils/localize';
import { createFoldingRanges } from './createFoldingRanges';
import { openGitHubLogContent } from './GitHubLogContentProvider';
import { LogState, parseGitHubLog } from './parseGitHubLog';

export async function openGitHubLog(context: IActionContext, node?: StepTreeItem): Promise<void> {
    if (!node) {
        node = await ext.rgApi.pickAppResource<StepTreeItem>(context, {
            filter: swaFilter,
            expectedChildContextValue: new RegExp(StepTreeItem.contextValue)
        });
    }

    let content: string;
    let foldingRanges: FoldingRange[] = [];

    try {
        const rawLogs = node instanceof JobTreeItem ? await node.getRawJobLog(context) : await node.parent.getRawJobLog(context);
        const logState: LogState = parseGitHubLog(rawLogs, new Date(node.data.started_at ?? ''), new Date(node.data.completed_at ?? ''));
        content = logState.filteredJobsLog.length ? logState.filteredJobsLog.join(EOL) : localize('noLogs', 'There are no logs to display for this step.');
        foldingRanges = createFoldingRanges(logState);
    } catch (err) {
        if (parseError(err).errorType !== '410') {
            throw err;
        }

        content = localize('expiredLogs', 'The logs for this run have expired and are no longer available.');
    }

    await openGitHubLogContent(node, content, foldingRanges);
}
