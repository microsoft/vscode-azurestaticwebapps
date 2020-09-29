/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementClient, WebSiteManagementModels } from '@azure/arm-appservice';
import { UsersGetAuthenticatedResponseData } from '@octokit/types';
import { IResourceGroupWizardContext } from 'vscode-azureextensionui';
import { GitTreeData, OrgForAuthenticatedUserData } from '../../gitHubTypings';
import { gitHubBranchData, gitHubRepoData } from '../../utils/gitHubUtils';

export interface IStaticWebAppWizardContext extends IResourceGroupWizardContext {
    accessToken: string;
    client: WebSiteManagementClient;

    orgData?: UsersGetAuthenticatedResponseData | OrgForAuthenticatedUserData;
    repoData?: gitHubRepoData;
    branchData?: gitHubBranchData;

    repoHtmlUrl?: string;
    fsPath?: string;

    newStaticWebAppName?: string;
    newRepoName?: string;

    gitTreeDataTask?: Promise<GitTreeData[]>;

    appLocation?: string;
    apiLocation?: string;
    appArtifactLocation?: string;

    // created when the wizard is done executing
    staticWebApp?: WebSiteManagementModels.StaticSiteARMResource;
}
