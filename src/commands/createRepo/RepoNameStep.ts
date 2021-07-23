/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit } from '@octokit/rest';
import { AzureWizardPromptStep, IActionContext, IParsedError, parseError } from 'vscode-azureextensionui';
import { localize } from '../../utils/localize';
import { nonNullProp } from '../../utils/nonNull';
import { IStaticWebAppWizardContext } from '../createStaticWebApp/IStaticWebAppWizardContext';
import { createOctokitClient } from '../github/createOctokitClient';

export class RepoNameStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    public async prompt(context: IStaticWebAppWizardContext): Promise<void> {
        const name: string | undefined = context.newStaticWebAppName;
        const value: string | undefined = await RepoNameStep.validateRepoName(context, name) === undefined ? name : undefined;

        context.newRepoName = (await context.ui.showInputBox({
            prompt: localize('newRepoPrompt', 'Enter the name of the new GitHub repository. Azure Static Web Apps automatically builds and deploys using GitHub Actions.'),
            validateInput: async (value: string): Promise<string | undefined> => await RepoNameStep.validateRepoName(context, value),
            value
        })).trim();
        context.valuesToMask.push(context.newRepoName);
    }

    public shouldPrompt(context: IStaticWebAppWizardContext): boolean {
        return !context.newRepoName;
    }

    public static async validateRepoName(context: Partial<IStaticWebAppWizardContext> & IActionContext, name: string | undefined): Promise<string | undefined> {
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

    private static async isRepoAvailable(context: Partial<IStaticWebAppWizardContext> & IActionContext, repo: string): Promise<boolean> {
        const client: Octokit = await createOctokitClient(context);
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
}
