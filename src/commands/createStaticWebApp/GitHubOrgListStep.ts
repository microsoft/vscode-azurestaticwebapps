/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit } from "@octokit/rest";
import { OctokitResponse, OrgsListForAuthenticatedUserResponseData, UsersGetAuthenticatedResponseData } from "@octokit/types";
import { AzureWizardPromptStep, IAzureQuickPickItem } from 'vscode-azureextensionui';
import { ext } from '../../extensionVariables';
import { OrgForAuthenticatedUserData } from "../../gitHubTypings";
import { createQuickPickFromJsons } from '../../utils/gitHubUtils';
import { localize } from '../../utils/localize';
import { createOctokitClient } from "../github/createOctokitClient";
import { IStaticWebAppWizardContext } from './IStaticWebAppWizardContext';

export class GitHubOrgListStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    public async prompt(context: IStaticWebAppWizardContext): Promise<void> {
        const placeHolder: string = localize('chooseOrg', 'Choose organization.');
        let orgData: UsersGetAuthenticatedResponseData | OrgForAuthenticatedUserData | undefined;

        do {
            orgData = (await ext.ui.showQuickPick(this.getOrganizations(context), { placeHolder })).data;
        } while (!orgData);

        context.orgData = orgData;
    }

    public shouldPrompt(context: IStaticWebAppWizardContext): boolean {
        return !context.repoHtmlUrl;
    }

    private async getOrganizations(_context: IStaticWebAppWizardContext): Promise<IAzureQuickPickItem<UsersGetAuthenticatedResponseData | OrgForAuthenticatedUserData | undefined>[]> {
        const octokitClient: Octokit = await createOctokitClient();
        const userRes: OctokitResponse<UsersGetAuthenticatedResponseData> = await octokitClient.users.getAuthenticated();
        let quickPickItems: IAzureQuickPickItem<UsersGetAuthenticatedResponseData | OrgForAuthenticatedUserData>[] = createQuickPickFromJsons<UsersGetAuthenticatedResponseData>([userRes.data], 'login');

        const orgRes: OctokitResponse<OrgsListForAuthenticatedUserResponseData> = await octokitClient.orgs.listForAuthenticatedUser();
        quickPickItems = quickPickItems.concat(createQuickPickFromJsons<OrgForAuthenticatedUserData>(orgRes.data, 'login'));

        return quickPickItems;
    }
}
