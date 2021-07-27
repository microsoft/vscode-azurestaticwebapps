/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit } from '@octokit/rest';
import { IActionContext, IAzureQuickPickItem } from 'vscode-azureextensionui';
import { RepoNameStep } from '../commands/createRepo/RepoNameStep';
import { GitHubOrgListStep } from '../commands/createStaticWebApp/GitHubOrgListStep';
import { IStaticWebAppWizardContext } from '../commands/createStaticWebApp/IStaticWebAppWizardContext';
import { createOctokitClient } from '../commands/github/createOctokitClient';
import { templateReposUsername } from '../constants';
import { RepoData, RepoResponse } from '../gitHubTypings';
import { localize } from './localize';

export async function getTemplateReposFromGitHub(context: IActionContext): Promise<RepoData[]> {
    const client: Octokit = await createOctokitClient(context);

    const allRepositories: RepoResponse = await client.repos.listForUser({
        username: templateReposUsername
    });

    return allRepositories.data.filter((repo) => repo.is_template);
}

export async function pickTemplate(context: IActionContext): Promise<RepoData> {
    const templateRepos: RepoData[] = await getTemplateReposFromGitHub(context);

    const placeHolder: string = localize('chooseTemplatePrompt', 'Choose a static web app template for the new repository.');
    const picks: IAzureQuickPickItem<RepoData>[] = templateRepos.map((repo) => { return { label: repo.name, data: repo }; });
    const pick: IAzureQuickPickItem<RepoData> = await context.ui.showQuickPick(picks, { placeHolder, suppressPersistence: true });

    return pick.data;
}

export async function promptForTemplateRepoName(context: IActionContext, template: RepoData): Promise<string> {
    const templateName = template.name;

    const validateNameContext: Partial<IStaticWebAppWizardContext> & IActionContext = {
        ...context,
        orgData: await GitHubOrgListStep.getAuthenticatedUser(context)
    }

    const validateRepoName = async (value: string): Promise<string | undefined> => await RepoNameStep.validateRepoName(validateNameContext, value);
    const isTemplateNameAValidRepoName = !(await validateRepoName(templateName));
    const newRepoName = await context.ui.showInputBox({
        validateInput: validateRepoName,
        prompt: localize('newRepoFromTemplatePrompt', 'Enter the name of the new GitHub repository to create from the "{0}" template.', templateName),
        value: isTemplateNameAValidRepoName ? templateName : ''
    });

    return newRepoName;
}
