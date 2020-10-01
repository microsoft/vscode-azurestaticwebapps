/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit } from "@octokit/rest";
import { appendExtensionUserAgent } from "vscode-azureextensionui";
import { getGitHubAccessToken } from "../../utils/gitHubUtils";

// token should only be passed in during a wizard; otherwise retrieve a new token for the request
export async function createOctokitClient(token?: string): Promise<Octokit> {
    token = token || await getGitHubAccessToken();
    return new Octokit(
        {
            userAgent: appendExtensionUserAgent(),
            auth: token
        });
}
