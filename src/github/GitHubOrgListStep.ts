/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { workspace } from 'vscode';
import { AzureWizardPromptStep, IAzureQuickPickItem } from 'vscode-azureextensionui';
import { githubApiEndpoint } from '../constants';
import { ext } from '../extensionVariables';
import { IGitHubAccessTokenContext } from '../IGitHubAccessTokenContext';
import { createGitHubRequestOptions, createQuickPickFromJsons, getGitHubJsonResponse, gitHubOrgData, gitHubWebResource, tryGetRemote } from '../utils/gitHubUtils';
import { localize } from '../utils/localize';

export class GitHubOrgListStep extends AzureWizardPromptStep<IGitHubAccessTokenContext> {
    public async prompt(context: IGitHubAccessTokenContext): Promise<void> {

        if (workspace.workspaceFolders && workspace.workspaceFolders.length > 0) {
            // returns empty string if no valid remote detected
            context.repoHtmlUrl = await tryGetRemote(context, workspace.workspaceFolders[0].uri.fsPath);
            if (context.repoHtmlUrl) {
                return;
            }
        }

        const placeHolder: string = localize('chooseOrg', 'Choose organization.');
        let orgData: gitHubOrgData | undefined;

        do {
            orgData = (await ext.ui.showQuickPick(this.getOrganizations(context), { placeHolder })).data;
        } while (!orgData);

        context.orgData = orgData;
    }

    public shouldPrompt(context: IGitHubAccessTokenContext): boolean {
        return !context.repoHtmlUrl || !context.orgData;
    }

    private async getOrganizations(context: IGitHubAccessTokenContext): Promise<IAzureQuickPickItem<gitHubOrgData | undefined>[]> {
        let requestOptions: gitHubWebResource = await createGitHubRequestOptions(context, `${githubApiEndpoint}/user`);
        let quickPickItems: IAzureQuickPickItem<gitHubOrgData>[] = createQuickPickFromJsons<gitHubOrgData>(await getGitHubJsonResponse<gitHubOrgData[]>(requestOptions), 'login');

        requestOptions = await createGitHubRequestOptions(context, `${githubApiEndpoint}/user/orgs`);
        quickPickItems = quickPickItems.concat(createQuickPickFromJsons<gitHubOrgData>(await getGitHubJsonResponse<gitHubOrgData[]>(requestOptions), 'login'));

        return quickPickItems;
    }
}
