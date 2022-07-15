/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IParsedError, nonNullProp, parseError } from '@microsoft/vscode-azext-utils';
import { Octokit } from '@octokit/rest';
import { localize } from '../../utils/localize';
import { IStaticWebAppWizardContext } from '../createStaticWebApp/IStaticWebAppWizardContext';
import { createOctokitClient } from '../github/createOctokitClient';

export class RepoNameStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    public async prompt(context: IStaticWebAppWizardContext): Promise<void> {
        const name: string | undefined = context.newStaticWebAppName;
        const value: string | undefined = await this.validateRepoName(context, name) === undefined ? name : undefined;

        context.newRepoName = (await context.ui.showInputBox({
            prompt: localize('newRepoPrompt', 'Enter the name of the new GitHub repository. Azure Static Web Apps automatically builds and deploys using GitHub Actions.'),
            validateInput: async (value: string): Promise<string | undefined> => await this.validateRepoName(context, value),
            value
        })).trim();
        context.valuesToMask.push(context.newRepoName);
    }

    public shouldPrompt(context: IStaticWebAppWizardContext): boolean {
        return !context.newRepoName;
    }

    protected async isRepoAvailable(context: IStaticWebAppWizardContext, repo: string): Promise<boolean> {
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
