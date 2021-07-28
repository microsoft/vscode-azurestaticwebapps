/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { EOL } from 'os';
import { IActionContext, openReadOnlyContent } from 'vscode-azureextensionui';
import { ext } from '../../extensionVariables';
import { JobTreeItem } from '../../tree/JobTreeItem';
import { StepTreeItem } from '../../tree/StepTreeItem';
import { createFoldingRanges } from './foldingProvider/foldingRangesCommands';
import { getFoldingRanges, setFoldingRanges } from './foldingProvider/foldingRangesMap';
import { logState, parseGitHubLog } from './parseGitHubLog';

export async function openGitHubLog(context: IActionContext, node?: StepTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<StepTreeItem>(StepTreeItem.contextValue, context);
    }

    const rawLogs = node instanceof JobTreeItem ? await node.getRawJobLog(context) : await node.parent.getRawJobLog(context);
    const logState: logState = parseGitHubLog(rawLogs, new Date(node.data.started_at), new Date(node.data.completed_at));

    const content = await openReadOnlyContent({ label: `${node.label}-gh`, fullId: node.fullId }, logState.filteredJobsLog.join(EOL), '.log');
    const foldingRanges = getFoldingRanges(content._uri) || createFoldingRanges(logState);
    setFoldingRanges(content._uri, foldingRanges);
}
