/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit } from '@octokit/rest';
import { ReposCreateForAuthenticatedUserResponseData, ReposCreateInOrgResponseData } from '@octokit/types';
import { basename } from 'path';
import { MessageItem, Progress, Uri } from 'vscode';
import { AzureWizardExecuteStep } from "vscode-azureextensionui";
import { ext } from '../../extensionVariables';
import { getGitApi } from '../../getExtensionApi';
import { API, Branch } from '../../git';
import { cpUtils } from '../../utils/cpUtils';
import { isUser } from "../../utils/gitHubUtils";
import { localize } from '../../utils/localize';
import { nonNullProp } from '../../utils/nonNull';
import { createOctokitClient } from '../github/createOctokitClient';
import { IStaticWebAppWizardContext } from './IStaticWebAppWizardContext';

type RepoCreateData = ReposCreateForAuthenticatedUserResponseData | ReposCreateInOrgResponseData;
export class RepoCreateStep extends AzureWizardExecuteStep<IStaticWebAppWizardContext> {
    // should happen before resource group create step
    public priority: number = 90;

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

        let remoteName: string = 'origin';
        // ask this before we create the repo so that the user can cancel

        if (wizardContext.repo?.state.remotes.find((remote) => { return remote.name === remoteName; })) {
            const rewriteMsgBtn: MessageItem = { title: localize('rename', 'Rename') };
            const input: MessageItem = await ext.ui.showWarningMessage(localize('remoteExists', 'Remote "{0}" already exists in "{1}".', remoteName, basename(projectPath)), { modal: true }, rewriteMsgBtn, { title: localize('overwrite', 'Overwrite') });
            if (input === rewriteMsgBtn) {
                remoteName = await this.getRemoteName(wizardContext, projectPath);
            } else {
                await wizardContext.repo?.removeRemote(remoteName);
            }
        }

        const client: Octokit = await createOctokitClient(wizardContext.accessToken);
        const repo: { name: string; isPrivate?: boolean } = nonNullProp(wizardContext, 'newRepo');
        const gitHubRepoRes: RepoCreateData = (isUser(wizardContext.orgData) ? await client.repos.createForAuthenticatedUser({ name: repo.name, private: repo.isPrivate }) :
            await client.repos.createInOrg({ org: nonNullProp(wizardContext, 'orgData').login, name: repo.name, private: repo.isPrivate })).data;
        wizardContext.repoHtmlUrl = gitHubRepoRes.html_url;

        await wizardContext.repo?.addRemote(remoteName, gitHubRepoRes.clone_url);
        const branch: Branch | undefined = await wizardContext.repo?.getBranch('HEAD');
        await wizardContext.repo?.push(remoteName, branch?.name, true);

        const createdGitHubRepo: string = localize('createdGitHubRepo', 'Created new {0} GitHub repository "{1}"', privacy, wizardContext.newRepo?.name);
        ext.outputChannel.appendLog(createdGitHubRepo);
        progress.report({ message: createdGitHubRepo });
    }

    public shouldExecute(wizardContext: IStaticWebAppWizardContext): boolean {
        return !!(wizardContext.accessToken && wizardContext.newRepo);
    }

    private async getRemoteName(wizardContext: IStaticWebAppWizardContext, projectPath: string): Promise<string> {
        return await ext.ui.showInputBox({
            placeHolder: localize('enterRemote', 'Enter a unique remote name'), validateInput: async (value) => {
                if (value.length === 0) {
                    return localize('invalidLength', 'The name must be between at least 1 character.');
                } else {
                    // remotes have same naming rules as branches
                    // https://stackoverflow.com/questions/41461152/which-characters-are-illegal-within-a-git-remote-name
                    try {
                        await cpUtils.executeCommand(undefined, undefined, 'git', 'check-ref-format', '--branch', cpUtils.wrapArgInQuotes(value));
                    } catch (err) {
                        return localize('notValid', '"{0}" is not a valid remote name.', value);
                    }

                    if (wizardContext.repo?.state.remotes.find((remote) => { return remote.name === value; })) {
                        return localize('remoteExists', 'Remote "{0}" already exists in "{1}".', value, basename(projectPath));
                    }
                }

                return undefined;
            }
        });
    }

}
