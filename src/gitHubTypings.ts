/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ActionsGetJobForWorkflowRunResponseData, OrgsListForAuthenticatedUserResponseData } from "@octokit/types";

// we'll export the types until this is merged: https://github.com/octokit/types.ts/issues/120
export type OrgForAuthenticatedUserData = OrgsListForAuthenticatedUserResponseData[0];
export type ActionWorkflowStepData = ActionsGetJobForWorkflowRunResponseData['steps'][0];
