/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IAzureQuickPickItem } from 'vscode-azureextensionui';
import { githubApiEndpoint } from '../../constants';
import { ext } from '../../extensionVariables';
import { createGitHubRequestOptions, createQuickPickFromJsons, getGitHubJsonResponse, gitHubOrgData, gitHubWebResource } from '../../utils/gitHubUtils';
import { localize } from '../../utils/localize';
import { IStaticWebAppWizardContext } from './IStaticWebAppWizardContext';

export class GitHubOrgListStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    public async prompt(context: IStaticWebAppWizardContext): Promise<void> {
        const placeHolder: string = localize('chooseOrg', 'Choose organization.');
        let orgData: gitHubOrgData | undefined;

        do {
            orgData = (await ext.ui.showQuickPick(this.getOrganizations(context), { placeHolder })).data;
        } while (!orgData);

        context.orgData = orgData;
    }

    public shouldPrompt(context: IStaticWebAppWizardContext): boolean {
        return !context.repoHtmlUrl;
    }

    private async getOrganizations(context: IStaticWebAppWizardContext): Promise<IAzureQuickPickItem<gitHubOrgData | undefined>[]> {
        let requestOptions: gitHubWebResource = await createGitHubRequestOptions(context, `${githubApiEndpoint}/user`);
        let quickPickItems: IAzureQuickPickItem<gitHubOrgData>[] = createQuickPickFromJsons<gitHubOrgData>(await getGitHubJsonResponse<gitHubOrgData[]>(requestOptions), 'login');

        requestOptions = await createGitHubRequestOptions(context, `${githubApiEndpoint}/user/orgs`);
        quickPickItems = quickPickItems.concat(createQuickPickFromJsons<gitHubOrgData>(await getGitHubJsonResponse<gitHubOrgData[]>(requestOptions), 'login'));

        return quickPickItems;
    }
}
