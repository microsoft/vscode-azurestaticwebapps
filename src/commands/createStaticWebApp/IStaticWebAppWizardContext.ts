/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { UsersGetAuthenticatedResponseData } from '@octokit/types';
import { IResourceGroupWizardContext } from 'vscode-azureextensionui';
import { OrgForAuthenticatedUserData } from '../../gitHubTypings';
import { StaticWebApp } from '../../tree/StaticWebAppTreeItem';
import { gitHubBranchData, gitHubRepoData } from '../../utils/gitHubUtils';

export interface IStaticWebAppWizardContext extends IResourceGroupWizardContext {
    accessToken: string;

    orgData?: UsersGetAuthenticatedResponseData | OrgForAuthenticatedUserData;
    repoData?: gitHubRepoData;
    branchData?: gitHubBranchData;
    repoHtmlUrl?: string;
    fsPath?: string;

    newStaticWebAppName?: string;
    newRepoName?: string;

    appLocation?: string;
    apiLocation?: string;
    appArtifactLocation?: string;

    // created when the wizard is done executing
    staticWebApp?: StaticWebApp;
}
