/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureTreeItem, IResourceGroupWizardContext } from 'vscode-azureextensionui';
import { IGitHubAccessTokenContext } from '../../IGitHubAccessTokenContext';
import { StaticWebApp } from '../../tree/StaticWebAppTreeItem';
import { gitHubBranchData, gitHubOrgData, gitHubRepoData } from '../../utils/gitHubUtils';

export interface IStaticWebAppWizardContext extends IResourceGroupWizardContext, IGitHubAccessTokenContext {
    newStaticWebAppName?: string;

    orgData?: gitHubOrgData;
    repoData?: gitHubRepoData;
    branchData?: gitHubBranchData;
    node?: AzureTreeItem;

    appLocation?: string;
    apiLocation?: string;
    appArtifactLocation?: string;

    newRepoName?: string;

    staticWebApp?: StaticWebApp;
}
