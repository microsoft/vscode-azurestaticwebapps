/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Conclusion, Status } from "../gitHubTypings";
import { localize } from "./localize";

export function ensureConclusion(conclusion: string): Conclusion {
    if (Object.values(Conclusion).includes(<Conclusion>conclusion)) {
        return <Conclusion>conclusion;
    } else {
        throw new RangeError(localize('invalidConclusion', 'Invalid conclusion "{0}".', conclusion));
    }
}

export function convertConclusionToVerb(conclusion: Conclusion): string {
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

export function ensureStatus(status: string): Status {
    if (Object.values(Status).includes(<Status>status)) {
        return <Status>status;
    } else {
        throw new RangeError(localize('invalidStatus', 'Invalid status "{0}".', status));
    }
}

export function convertStatusToVerb(status: Status): string {
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
