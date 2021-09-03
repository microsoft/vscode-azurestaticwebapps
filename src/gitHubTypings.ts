/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
import { Endpoints } from "@octokit/types";

export type OrgForAuthenticatedUserData = Endpoints["GET /user"]["response"]["data"];
export type ListOrgsForUserData = Endpoints["GET /user/orgs"]["response"]["data"][0];

export type ActionsListJobsForWorkflowRunResponseData = Endpoints["GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs"]["response"]["data"];
export type ActionsGetJobForWorkflowRunResponseData = Endpoints["GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs"]["response"]["data"]["jobs"][0];
export type ActionWorkflowStepData = {
    status: "queued" | "in_progress" | "completed";
    conclusion: string | null;
    name: string;
    number: number;
    started_at?: string | null | undefined;
    completed_at?: string | null | undefined;
};

export type ActionsGetWorkflowRunResponseData = Endpoints["GET /repos/{owner}/{repo}/actions/runs/{run_id}"]["response"]["data"];
export type ActionsGetWorkflowResponseData = Endpoints["GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}"]["response"]["data"];
export type ActionsListWorkflowRunsForRepoResponseData = Endpoints["GET /repos/{owner}/{repo}/actions/runs"]["response"]["data"];
export type JobLogsForWorkflowRun = Endpoints["GET /repos/{owner}/{repo}/actions/jobs/{job_id}/logs"]["response"]["data"];

export type RepoParameters = Endpoints["GET /users/{username}/repos"]["parameters"] | Endpoints["GET /orgs/{org}/repos"]["parameters"];
export type ReposGetResponseData = Endpoints["GET /repos/{owner}/{repo}"]["response"]["data"];
export type RepoData = Endpoints["GET /users/{username}/repos"]["response"]["data"][0] | Endpoints["GET /orgs/{org}/repos"]["response"]["data"][0];
export type BranchData = Endpoints["GET /repos/{owner}/{repo}/branches"]["response"]["data"][0];

export type RepoResponse = Endpoints["GET /orgs/{org}/repos"]["response"] | Endpoints["GET /users/{username}/repos"]["response"];

export type ReposCreateForkResponse = RestEndpointMethodTypes["repos"]["createFork"]["response"];

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
