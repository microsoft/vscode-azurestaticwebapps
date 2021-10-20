/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementClient, WebSiteManagementModels } from '@azure/arm-appservice';
import { ICreateChildImplContext, IResourceGroupWizardContext } from 'vscode-azureextensionui';
import { Repository } from '../../git';
import { BranchData, ListOrgsForUserData, OrgForAuthenticatedUserData } from '../../gitHubTypings';
import { ILocalProjectWizardContext } from '../setupRunningInVSCode/ILocalProjectWizardContext';

export interface IStaticWebAppWizardContext extends IResourceGroupWizardContext, ICreateChildImplContext, ILocalProjectWizardContext {
    accessToken: string;
    client: WebSiteManagementClient;

    orgData?: OrgForAuthenticatedUserData | ListOrgsForUserData;
    branchData?: Partial<BranchData>;
    repoHtmlUrl?: string;

    repo?: Repository;

    newStaticWebAppName?: string;

    newRepoName?: string;
    newRepoIsPrivate?: boolean;
    newRemoteShortname?: string;

    originExists?: boolean;

    outputLocation?: string;

    sku?: WebSiteManagementModels.SkuDescription;

    // created when the wizard is done executing
    staticWebApp?: WebSiteManagementModels.StaticSiteARMResource;
}
