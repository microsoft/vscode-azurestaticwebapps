/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IParsedError, parseError } from 'vscode-azureextensionui';
import { githubApiEndpoint } from '../../constants';
import { ext } from '../../extensionVariables';
import { createGitHubRequestOptions, gitHubWebResource } from '../../utils/gitHubUtils';
import { localize } from '../../utils/localize';
import { nonNullProp } from '../../utils/nonNull';
import { requestUtils } from '../../utils/requestUtils';
import { IStaticWebAppWizardContext } from './IStaticWebAppWizardContext';

export class RepoNameStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    public async prompt(wizardContext: IStaticWebAppWizardContext): Promise<void> {
        wizardContext.newRepoName = (await ext.ui.showInputBox({
            prompt: localize('AppServicePlanPrompt', 'Enter the name of the new GitHub repository.'),
            validateInput: async (value: string): Promise<string | undefined> => await this.validateRepoName(wizardContext, value)
        })).trim();
    }

    public shouldPrompt(wizardContext: IStaticWebAppWizardContext): boolean {
        return !wizardContext.newRepoName;
    }

    protected async isRepoAvailable(context: IStaticWebAppWizardContext, name: string): Promise<boolean> {
        const requestOptions: gitHubWebResource = await createGitHubRequestOptions(context, `${githubApiEndpoint}/repos/${nonNullProp(context, 'orgData').login}/${name}`);
        try {
            await requestUtils.sendRequest(requestOptions);
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
