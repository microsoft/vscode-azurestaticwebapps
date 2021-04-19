/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit } from "@octokit/rest";
import { OctokitResponse } from "@octokit/types";
import { AzureWizardPromptStep, IAzureQuickPickItem } from 'vscode-azureextensionui';
import { ext } from '../../extensionVariables';
import { ListOrgsForUserData, OrgForAuthenticatedUserData } from "../../gitHubTypings";
import { createQuickPickFromJsons } from '../../utils/gitHubUtils';
import { localize } from '../../utils/localize';
import { createOctokitClient } from "../github/createOctokitClient";
import { IStaticWebAppWizardContext } from './IStaticWebAppWizardContext';

export class GitHubOrgListStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    public async prompt(context: IStaticWebAppWizardContext): Promise<void> {
        const placeHolder: string = localize('chooseOrg', 'Choose organization to create repository.');
        let orgData: OrgForAuthenticatedUserData | ListOrgsForUserData | undefined;

        do {
            orgData = (await ext.ui.showQuickPick(this.getOrganizations(context), { placeHolder })).data;
        } while (!orgData);

        context.orgData = orgData;
        context.valuesToMask.push(context.orgData.login);
    }

    public shouldPrompt(context: IStaticWebAppWizardContext): boolean {
        return !context.repoHtmlUrl;
    }

    private async getOrganizations(context: IStaticWebAppWizardContext): Promise<IAzureQuickPickItem<ListOrgsForUserData | OrgForAuthenticatedUserData | undefined>[]> {
        const octokitClient: Octokit = await createOctokitClient(context);
        const userRes: OctokitResponse<OrgForAuthenticatedUserData> = await octokitClient.users.getAuthenticated();
        let quickPickItems: IAzureQuickPickItem<ListOrgsForUserData | OrgForAuthenticatedUserData>[] = createQuickPickFromJsons<OrgForAuthenticatedUserData>([userRes.data], 'login');

        const orgRes: OctokitResponse<ListOrgsForUserData[]> = (await octokitClient.orgs.listForAuthenticatedUser());
        quickPickItems = quickPickItems.concat(createQuickPickFromJsons<ListOrgsForUserData | OrgForAuthenticatedUserData>(orgRes.data, 'login'));

        return quickPickItems;
    }
}
