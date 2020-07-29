/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ActionsGetJobForWorkflowRunResponseData, ActionsGetWorkflowRunResponseData } from '@octokit/types';
import * as moment from 'moment';
import * as path from 'path';
import { TreeItemIconPath } from 'vscode-azureextensionui';
import { ActionWorkflowStepData, Conclusion, Status } from "../gitHubTypings";
import { localize } from "./localize";
import { treeUtils } from "./treeUtils";

export function getActionIconPath(data: ActionWorkflowStepData | ActionsGetJobForWorkflowRunResponseData | ActionsGetWorkflowRunResponseData): TreeItemIconPath {
    return data.conclusion !== null ?
        treeUtils.getThemedIconPath(path.join('conclusions', ensureConclusion(data))) :
        treeUtils.getThemedIconPath(path.join('statuses', ensureStatus(data)));
}

export function getActionDescription(data: ActionWorkflowStepData | ActionsGetJobForWorkflowRunResponseData): string {
    if (data.conclusion !== null) {
        return localize('conclusionDescription', '{0} {1}', convertConclusionToVerb(ensureConclusion(data)), moment(data.completed_at).fromNow());
    } else {
        const nowStr: string = localize('now', 'now');
        return localize('statusDescription', '{0} {1}', convertStatusToVerb(ensureStatus(data)), new Date(data.started_at).getTime() === 0 ? nowStr : moment(data.started_at).fromNow());
    }
}

function ensureConclusion(data: { conclusion: string }): Conclusion {
    if (Object.values(Conclusion).includes(<Conclusion>data.conclusion)) {
        return <Conclusion>data.conclusion;
    } else {
        throw new RangeError(localize('invalidConclusion', 'Invalid conclusion "{0}".', data.conclusion));
    }
}

function convertConclusionToVerb(conclusion: Conclusion): string {
    switch (conclusion) {
        case Conclusion.Success:
            return localize('succeeded', 'succeeded');
        case Conclusion.Cancelled:
            return localize('cancelled', 'cancelled');
        case Conclusion.Failure:
            return localize('failed', 'failed');
        case Conclusion.Skipped:
            return localize('skipped', 'skipped');
        default:
            return '';
    }
}

function ensureStatus(data: { status: string }): Status {
    if (Object.values(Status).includes(<Status>data.status)) {
        return <Status>data.status;
    } else {
        throw new RangeError(localize('invalidStatus', 'Invalid status "{0}".', data.status));
    }
}

function convertStatusToVerb(status: Status): string {
    switch (status) {
        case Status.InProgress:
            return localize('started', 'started');
        case Status.Queued:
            return localize('queued', 'queued');
        case Status.Completed:
            return localize('completed', 'completed');
        default:
            return '';
    }
}
