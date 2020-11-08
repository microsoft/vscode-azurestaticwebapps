/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit } from '@octokit/rest';
import { ReposCreateForAuthenticatedUserResponseData, ReposCreateInOrgResponseData } from '@octokit/types';
import { Progress, Uri } from 'vscode';
import { AzureWizardExecuteStep } from "vscode-azureextensionui";
import { ext } from '../../extensionVariables';
import { getGitApi } from '../../getExtensionApi';
import { API, Branch } from '../../git';
import { generateGitignore, isUser } from "../../utils/gitHubUtils";
import { localize } from '../../utils/localize';
import { nonNullProp } from '../../utils/nonNull';
import { createOctokitClient } from '../github/createOctokitClient';
import { IStaticWebAppWizardContext } from './IStaticWebAppWizardContext';

type RepoCreateData = ReposCreateForAuthenticatedUserResponseData | ReposCreateInOrgResponseData;
export class RepoCreateStep extends AzureWizardExecuteStep<IStaticWebAppWizardContext> {
    public priority: number = 200;

    public async execute(wizardContext: IStaticWebAppWizardContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const privacy: string = wizardContext.newRepo?.isPrivate ? 'private' : 'public';
        const creatingGitHubRepo: string = localize('creatingGitHubRepo', 'Creating new {0} GitHub repository "{1}"', privacy, wizardContext.newRepo?.name);
        ext.outputChannel.appendLog(creatingGitHubRepo);
        progress.report({ message: creatingGitHubRepo });

        const projectPath: string = nonNullProp(wizardContext, 'fsPath');
        const uri: Uri = Uri.file(projectPath);

        const git: API = await getGitApi();
        wizardContext.repo = git?.getRepository(uri);
        if (!wizardContext.repo) {
            // needs to be initialized
            wizardContext.repo = await git?.init(uri);
        }
        if (!wizardContext.repo?.state.HEAD?.commit) {
            // needs to have an initial commit
            await wizardContext.repo?.commit(localize('initCommit', 'Initial commit'), { all: true });
        }

        const origin: string = 'origin';
        // ask this before we create the repo so that the user can cancel
        if (wizardContext.repo?.state.remotes.find((remote) => { return remote.name === origin; })) {
            await ext.ui.showWarningMessage(localize('remoteExists', 'Remote branch "{0}" already exists. Overwrite?', origin), { modal: true }, { title: localize('overwrite', 'Overwrite') });
            await wizardContext.repo?.removeRemote(origin);
        }

        await generateGitignore(projectPath);

        const client: Octokit = await createOctokitClient(wizardContext.accessToken);
        const repo: { name: string; isPrivate?: boolean } = nonNullProp(wizardContext, 'newRepo');
        const gitHubRepoRes: RepoCreateData = (isUser(wizardContext.orgData) ? await client.repos.createForAuthenticatedUser({ name: repo.name, private: repo.isPrivate }) :
            await client.repos.createInOrg({ org: nonNullProp(wizardContext, 'orgData').login, name: repo.name, private: repo.isPrivate })).data;
        wizardContext.repoHtmlUrl = gitHubRepoRes.html_url;

        await wizardContext.repo?.addRemote(origin, gitHubRepoRes.clone_url);
        const branch: Branch | undefined = await wizardContext.repo?.getBranch('HEAD');
        await wizardContext.repo?.push('origin', branch?.name, true);

        const createdGitHubRepo: string = localize('createdGitHubRepo', 'Created new {0} GitHub repository "{1}"', privacy, wizardContext.newRepo?.name);
        ext.outputChannel.appendLog(createdGitHubRepo);
        progress.report({ message: createdGitHubRepo });
    }

    public shouldExecute(wizardContext: IStaticWebAppWizardContext): boolean {
        return !!(wizardContext.accessToken && wizardContext.newRepo);
    }

}
