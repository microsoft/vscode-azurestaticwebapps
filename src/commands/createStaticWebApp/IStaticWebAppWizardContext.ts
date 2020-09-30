/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { UsersGetAuthenticatedResponseData } from '@octokit/types';
import { IResourceGroupWizardContext } from 'vscode-azureextensionui';
import { BranchData, GitTreeData, OrgForAuthenticatedUserData, RepoData } from '../../gitHubTypings';
import { StaticWebApp } from '../../tree/StaticWebAppTreeItem';

// creating a dummy repoData/branchData would be an annoying amount of work, so use this type to recognize when users have selected create new repo
export type CreateNewResource = { name?: string; html_url?: string };
export interface IStaticWebAppWizardContext extends IResourceGroupWizardContext {
    accessToken: string;

    orgData?: UsersGetAuthenticatedResponseData | OrgForAuthenticatedUserData;
    repoData?: RepoData | CreateNewResource;
    branchData?: BranchData | CreateNewResource;

    repoHtmlUrl?: string;
    fsPath?: string;

    newStaticWebAppName?: string;
    newRepoName?: string;

    gitTreeDataTask?: Promise<GitTreeData[]>;

    appLocation?: string;
    apiLocation?: string;
    appArtifactLocation?: string;

    // created when the wizard is done executing
    staticWebApp?: StaticWebApp;
}
