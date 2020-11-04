/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit } from '@octokit/rest';
import { commands, extensions, Uri } from 'vscode';
import { AzureWizardPromptStep, IParsedError, parseError } from 'vscode-azureextensionui';
import { ext } from '../../extensionVariables';
import { GitExtension } from '../../git';
import { localize } from '../../utils/localize';
import { nonNullProp } from '../../utils/nonNull';
import { createOctokitClient } from '../github/createOctokitClient';
import { IStaticWebAppWizardContext } from './IStaticWebAppWizardContext';

export class RepoNameStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    public async prompt(wizardContext: IStaticWebAppWizardContext): Promise<void> {
        const gitExtension = extensions.getExtension<GitExtension>('vscode.git')?.exports;
        const git = gitExtension?.getAPI(1);

        // needs to be initialized
        // needs to have a commit
        // if it has a remote already, might screw things up
        // if remote exists, it tries to push to it
        // if remote doesn't exist, it throws an error
        // if its awaited, then have to interact with hard to see notification dialog
        // maybe see if repo state has changed?
        // try to get repo
        // use repo API calls?
        const uri: Uri = Uri.file(wizardContext.fsPath!);
        let repo = git?.getRepository(uri);
        if (!repo) {
            repo = await git?.init(uri);
        }

        repo?.state.onDidChange((e) => {
            console.log(e);
        });

        repo?.ui.onDidChange((e) => {
            console.log(e);
        });

        try {
            await commands.executeCommand('git.publish');
        } catch (err) {
            console.log(err);
        }

        wizardContext.newRepoName = (await ext.ui.showInputBox({
            prompt: localize('AppServicePlanPrompt', 'Enter the name of the new GitHub repository.'),
            validateInput: async (value: string): Promise<string | undefined> => await this.validateRepoName(wizardContext, value)
        })).trim();
    }

    public shouldPrompt(wizardContext: IStaticWebAppWizardContext): boolean {
        return !wizardContext.newRepoName;
    }

    protected async isRepoAvailable(context: IStaticWebAppWizardContext, repo: string): Promise<boolean> {
        const client: Octokit = await createOctokitClient(context.accessToken);
        try {
            await client.repos.get({ owner: nonNullProp(context, 'orgData').login, repo });
        } catch (err) {
            const parsedError: IParsedError = parseError(err);
            // if the repo doesn't exist, it throws a 404 Not Found error
            if (parsedError.message.includes('Not Found')) {
                return true;
            }

            throw err;
        }

        return false;
    }

    private async validateRepoName(context: IStaticWebAppWizardContext, name: string | undefined): Promise<string | undefined> {
        name = name ? name.trim() : '';

        if (name === '.' || name === '..') {
            return localize('reserved', 'The repository "{0}" is reserved.', name);
        } else if (name.length < 1) {
            return localize('invalidLength', 'The name must be between at least 1 character.');
        } else if (!await this.isRepoAvailable(context, name)) {
            return localize('nameUnavailable', 'The repository "{0}" already exists on this account.', name);
        } else {
            return undefined;
        }
    }
}
