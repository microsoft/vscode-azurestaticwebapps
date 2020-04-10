/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { workspace } from 'vscode';
import { AzureWizardPromptStep, IAzureQuickPickItem } from 'vscode-azureextensionui';
import { createGitHubRepo } from '../commands/createGitHubRepo';
import { IStaticSiteWizardContext } from '../commands/createStaticWebApp/IStaticSiteWizardContext';
import { githubApiEndpoint } from '../constants';
import { ext } from '../extensionVariables';
import { IGitHubAccessTokenContext } from '../IGitHubAccessTokenContext';
import { createGitHubRequestOptions, createQuickPickFromJsons, getGitHubJsonResponse, gitHubOrgData, gitHubWebResource, tryGetRemote } from '../utils/gitHubUtils';
import { localize } from '../utils/localize';

const createNewRepo: string = 'createNewRepo';

export class GitHubOrgListStep extends AzureWizardPromptStep<IGitHubAccessTokenContext> {
    public async prompt(context: IGitHubAccessTokenContext): Promise<void> {
        const quickPickItems: IAzureQuickPickItem<gitHubOrgData | undefined>[] = [];

        if (workspace.workspaceFolders && workspace.workspaceFolders.length > 0) {
            // returns empty string if no remote
            context.repoHtmlUrl = await tryGetRemote(workspace.workspaceFolders[0].uri.fsPath);
            if (context.repoHtmlUrl) {
                return;
            }

            if (!context.orgData) {
                // if there is a workspace, but no repo, add the create Repo
                quickPickItems.push({ label: localize(createNewRepo, '$(plus) Create a new GitHub repository...'), data: { login: createNewRepo, repos_url: createNewRepo } });
            }

        }

        const placeHolder: string = localize('chooseOrg', 'Choose organization.');
        let orgData: gitHubOrgData | undefined;

        do {
            orgData = (await ext.ui.showQuickPick(quickPickItems.concat(await this.getOrganizations(context)), { placeHolder })).data;
        } while (!orgData);

        context.orgData = orgData;
    }

    public shouldPrompt(context: IGitHubAccessTokenContext): boolean {
        return !context.repoHtmlUrl;
    }

    public async getSubWizard(context: IStaticSiteWizardContext): Promise<undefined> {
        if (context.orgData?.login === createNewRepo) {
            await createGitHubRepo(context);
        }
        return;
    }

    private async getOrganizations(context: IGitHubAccessTokenContext): Promise<IAzureQuickPickItem<gitHubOrgData | undefined>[]> {
        let requestOptions: gitHubWebResource = await createGitHubRequestOptions(context, `${githubApiEndpoint}/user`);
        let quickPickItems: IAzureQuickPickItem<gitHubOrgData>[] = createQuickPickFromJsons<gitHubOrgData>(await getGitHubJsonResponse<gitHubOrgData[]>(requestOptions), 'login');

        requestOptions = await createGitHubRequestOptions(context, `${githubApiEndpoint}/user/orgs`);
        quickPickItems = quickPickItems.concat(createQuickPickFromJsons<gitHubOrgData>(await getGitHubJsonResponse<gitHubOrgData[]>(requestOptions), 'login'));

        return quickPickItems;
    }
}
