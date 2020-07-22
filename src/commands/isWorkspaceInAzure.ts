/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { StaticEnvironment } from "../tree/EnvironmentTreeItem";
import { StaticWebApp } from "../tree/StaticWebAppTreeItem";
import { tryGetBranch, tryGetRemote } from "../utils/gitHubUtils";

export async function isWorkspaceInAzure(swa: StaticWebApp, env: StaticEnvironment): Promise<boolean> {
    const remote: string | undefined = await tryGetRemote();
    const branch: string | undefined = remote ? await tryGetBranch() : undefined;
    return swa.properties.repositoryUrl === remote && env.properties.sourceBranch === branch;
}
