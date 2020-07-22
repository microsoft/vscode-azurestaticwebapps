/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit } from "@octokit/rest";
import { appendExtensionUserAgent } from "vscode-azureextensionui";
import { getGitHubAccessToken } from "../../utils/gitHubUtils";

export async function createOctokitClient(): Promise<Octokit> {
    const token: string = await getGitHubAccessToken();
    return new Octokit(
        {
            userAgent: appendExtensionUserAgent(),
            auth: token
        });
}
