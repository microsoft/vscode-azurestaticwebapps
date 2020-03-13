/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureTreeItem, IResourceGroupWizardContext } from 'vscode-azureextensionui';
import { gitHubBranchData, gitHubOrgData, gitHubRepoData } from './connectToGitHub';

export interface IStaticSiteWizardContext extends IResourceGroupWizardContext {
    newSiteName?: string;
    orgData?: gitHubOrgData;
    repoData?: gitHubRepoData;
    branchData?: gitHubBranchData;
    node?: AzureTreeItem;
    accessToken?: string;
}
