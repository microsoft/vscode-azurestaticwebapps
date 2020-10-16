/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ActionsGetJobForWorkflowRunResponseData, GitGetTreeResponseData, OrgsListForAuthenticatedUserResponseData, ReposListBranchesResponseData, ReposListForOrgResponseData } from "@octokit/types";

// we'll export the types until this is fixed: https://github.com/octokit/types.ts/issues/120
export type OrgForAuthenticatedUserData = OrgsListForAuthenticatedUserResponseData[0];
export type GitTreeData = GitGetTreeResponseData['tree'][0];
export type ActionWorkflowStepData = ActionsGetJobForWorkflowRunResponseData['steps'][0];
export type RepoData = ReposListForOrgResponseData[0];
export type BranchData = ReposListBranchesResponseData[0];

// Doc for these parameter values: https://developer.github.com/v3/checks/runs/#parameters
export enum Conclusion {
    Success = 'success',
    Failure = 'failure',
    Skipped = 'skipped',
    Cancelled = 'cancelled'
}

export enum Status {
    Queued = 'queued',
    InProgress = 'in_progress',
    Completed = 'completed'
}
