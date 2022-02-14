/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IActionContext, IAzureQuickPickItem } from '@microsoft/vscode-azext-utils';
import { Octokit } from "@octokit/rest";
import { OctokitResponse } from "@octokit/types";
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
            orgData = (await context.ui.showQuickPick(this.getOrganizations(context), { placeHolder })).data;
        } while (!orgData);

        context.orgData = orgData;
        context.valuesToMask.push(context.orgData.login);
    }

    public shouldPrompt(context: IStaticWebAppWizardContext): boolean {
        // if orgData was set earlier, we should push the value to mask
        if (context.orgData) {
            context.valuesToMask.push(context.orgData.login);
        }

        return !context.repoHtmlUrl && !context.orgData;
    }

    private async getOrganizations(context: IStaticWebAppWizardContext): Promise<IAzureQuickPickItem<ListOrgsForUserData | OrgForAuthenticatedUserData | undefined>[]> {
        const octokitClient: Octokit = await createOctokitClient(context);

        const userData: OrgForAuthenticatedUserData = await GitHubOrgListStep.getAuthenticatedUser(context, octokitClient);
        let quickPickItems: IAzureQuickPickItem<ListOrgsForUserData | OrgForAuthenticatedUserData>[] = createQuickPickFromJsons<OrgForAuthenticatedUserData>([userData], 'login');
        const orgRes: OctokitResponse<ListOrgsForUserData[]> = (await octokitClient.orgs.listForAuthenticatedUser());
        quickPickItems = quickPickItems.concat(createQuickPickFromJsons<ListOrgsForUserData | OrgForAuthenticatedUserData>(orgRes.data, 'login'));

        return quickPickItems;
    }

    public static async getAuthenticatedUser(context: IActionContext & Partial<IStaticWebAppWizardContext>, octokitClient?: Octokit): Promise<OrgForAuthenticatedUserData> {
        octokitClient = octokitClient || await createOctokitClient(context);
        const userRes: OctokitResponse<OrgForAuthenticatedUserData> = await octokitClient.users.getAuthenticated();

        return userRes.data;
    }
}
