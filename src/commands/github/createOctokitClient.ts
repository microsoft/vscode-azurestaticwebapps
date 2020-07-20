/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit } from "@octokit/rest";
import { appendExtensionUserAgent } from "vscode-azureextensionui";

export function createOctokitClient(token: string): Octokit {
    return new Octokit(
        {
            userAgent: appendExtensionUserAgent(),
            auth: token
        });
}
