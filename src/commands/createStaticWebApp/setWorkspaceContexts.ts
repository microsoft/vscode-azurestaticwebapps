/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WorkspaceFolder } from 'vscode';
import { IActionContext } from "vscode-azureextensionui";
import { getGitWorkspaceState, GitWorkspaceState, remoteShortnameExists, VerifiedGitWorkspaceState, verifyGitWorkspaceForCreation, warnIfNotOnDefaultBranch } from "../../utils/gitUtils";
import { localize } from '../../utils/localize';
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
        if (!gitWorkspaceState.repo?.state.HEAD?.upstream) {
            // current branch does not exist on remote, ask to push
            await context.ui.showWarningMessage(localize('pushBranch', 'Branch needs to exist on the remote. Push branch and set upstream?'), {
                modal: true
            }, { title: localize('pushAndSetUpstream', 'Push and set upstream') });
            await verifiedWorkspace.repo.push('origin', verifiedWorkspace.repo.state.HEAD?.name, true);
        }
        context.branchData = { name: verifiedWorkspace.repo.state.HEAD?.name };
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
