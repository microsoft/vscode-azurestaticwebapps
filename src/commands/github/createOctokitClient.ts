/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit } from "@octokit/rest";
import { appendExtensionUserAgent, parseError } from "vscode-azureextensionui";
import { getGitHubAccessToken, logoutOfGitHubSession } from "../../utils/gitHubUtils";

// token should only be passed in during a wizard; otherwise retrieve a new token for the request
export async function createOctokitClient(token?: string): Promise<Octokit> {
    const validateCredentials: boolean = !token;
    token = token || await getGitHubAccessToken();
    const client: Octokit = new Octokit(
        {
            userAgent: appendExtensionUserAgent(),
            auth: token
        });

    if (validateCredentials) {
        try {
            await client.users.getAuthenticated();
        } catch (error) {
            if (parseError(error).message.includes('Bad credentials')) {
                await logoutOfGitHubSession();
                return new Octokit(
                    {
                        userAgent: appendExtensionUserAgent(),
                        auth: await getGitHubAccessToken()
                    });
            }

            throw error;
        }
    }
    return client;
}
