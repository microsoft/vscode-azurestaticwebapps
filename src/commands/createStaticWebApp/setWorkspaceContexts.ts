/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WorkspaceFolder } from 'vscode';
import { IActionContext } from "vscode-azureextensionui";
import { getGitWorkspaceState, GitWorkspaceState, remoteShortnameExists, VerifiedGitWorkspaceState, verifyGitWorkspaceForCreation, warnIfNotOnDefaultBranch } from "../../utils/gitUtils";
import { GitHubOrgListStep } from './GitHubOrgListStep';
import { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";

export async function setWorkspaceContexts(context: IActionContext & Partial<IStaticWebAppWizardContext>, folder: WorkspaceFolder): Promise<void> {
    const gitWorkspaceState: GitWorkspaceState = await getGitWorkspaceState(context, folder.uri);
    const verifiedWorkspace: VerifiedGitWorkspaceState = await verifyGitWorkspaceForCreation(context, gitWorkspaceState, folder.uri);

    await warnIfNotOnDefaultBranch(context, verifiedWorkspace);
    context.fsPath = folder.uri.fsPath;
    context.repo = verifiedWorkspace.repo;

    if (gitWorkspaceState.remoteRepo) {
        context.repoHtmlUrl = gitWorkspaceState.remoteRepo.html_url;
        context.branchData = { name: gitWorkspaceState.remoteRepo.default_branch };
    } else {
        if (!context.advancedCreation) {
            // default repo to private for basic create
            context.newRepoIsPrivate = true;
            // set the org to the authenticated user for creation
            context.orgData = await GitHubOrgListStep.getAuthenticatedUser(context);
        }
    }
    const origin: string = 'origin';
    context.originExists = await remoteShortnameExists(context.fsPath, origin);
    context.newRemoteShortname = context.originExists ? undefined : origin;
}
