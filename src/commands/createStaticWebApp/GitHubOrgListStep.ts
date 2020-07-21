/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { OctokitResponse, OrgsListForAuthenticatedUserResponseData, UsersGetAuthenticatedResponseData } from "@octokit/types";
import { AzureWizardPromptStep, IAzureQuickPickItem } from 'vscode-azureextensionui';
import { ext } from '../../extensionVariables';
import { OrgsListForAuthenticatedUserData } from "../../gitHubTypings";
import { createQuickPickFromJsons } from '../../utils/gitHubUtils';
import { localize } from '../../utils/localize';
import { IStaticWebAppWizardContext } from './IStaticWebAppWizardContext';

export class GitHubOrgListStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    public async prompt(context: IStaticWebAppWizardContext): Promise<void> {
        const placeHolder: string = localize('chooseOrg', 'Choose organization.');
        let orgData: UsersGetAuthenticatedResponseData | OrgsListForAuthenticatedUserData | undefined;

        do {
            orgData = (await ext.ui.showQuickPick(this.getOrganizations(context), { placeHolder })).data;
        } while (!orgData);

        context.orgData = orgData;
    }

    public shouldPrompt(context: IStaticWebAppWizardContext): boolean {
        return !context.repoHtmlUrl;
    }

    private async getOrganizations(_context: IStaticWebAppWizardContext): Promise<IAzureQuickPickItem<UsersGetAuthenticatedResponseData | OrgsListForAuthenticatedUserData | undefined>[]> {
        const userRes: OctokitResponse<UsersGetAuthenticatedResponseData> = await ext.octokit.users.getAuthenticated();
        let quickPickItems: IAzureQuickPickItem<UsersGetAuthenticatedResponseData | OrgsListForAuthenticatedUserData>[] = createQuickPickFromJsons<UsersGetAuthenticatedResponseData>([userRes.data], 'login');

        const orgRes: OctokitResponse<OrgsListForAuthenticatedUserResponseData> = await ext.octokit.orgs.listForAuthenticatedUser();
        quickPickItems = quickPickItems.concat(createQuickPickFromJsons<OrgsListForAuthenticatedUserData>(orgRes.data, 'login'));

        return quickPickItems;
    }
}
