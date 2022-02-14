/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { appendExtensionUserAgent, IActionContext } from "@microsoft/vscode-azext-utils";
import { Octokit } from "@octokit/rest";
import { getGitHubAccessToken } from "../../utils/gitHubUtils";
import { IStaticWebAppWizardContext } from "../createStaticWebApp/IStaticWebAppWizardContext";

// token should only be passed in during a wizard; otherwise retrieve a new token for the request
export async function createOctokitClient(context: IActionContext & Partial<IStaticWebAppWizardContext>): Promise<Octokit> {
    const token: string = context.accessToken || await getGitHubAccessToken();
    return new Octokit(
        {
            userAgent: appendExtensionUserAgent(),
            auth: token
        });
}
