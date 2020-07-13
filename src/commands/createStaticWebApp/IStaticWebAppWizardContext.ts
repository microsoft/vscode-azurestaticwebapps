/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IResourceGroupWizardContext } from 'vscode-azureextensionui';
import { StaticWebApp } from '../../tree/StaticWebAppTreeItem';
import { gitHubBranchData, gitHubOrgData, gitHubRepoData } from '../../utils/gitHubUtils';
import { IGitHubContext } from '../github/IGitHubContext';

export interface IStaticWebAppWizardContext extends IResourceGroupWizardContext, IGitHubContext {
    orgData?: gitHubOrgData;
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
