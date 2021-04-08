/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementClient, WebSiteManagementModels } from '@azure/arm-appservice';
import { UsersGetAuthenticatedResponseData } from '@octokit/types';
import { ICreateChildImplContext, IResourceGroupWizardContext } from 'vscode-azureextensionui';
import { BranchData, OrgForAuthenticatedUserData, RepoData } from '../../gitHubTypings';
import { CreateScenario } from './CreateScenarioListStep';

// creating a dummy repoData/branchData would be an annoying amount of work, so use this type to recognize when users have selected create new repo
export type CreateNewResource = { name?: string; html_url?: string };
export interface IStaticWebAppWizardContext extends IResourceGroupWizardContext, ICreateChildImplContext {
    accessToken: string;
    client: WebSiteManagementClient;

    createScenario?: CreateScenario;

    orgData?: UsersGetAuthenticatedResponseData | OrgForAuthenticatedUserData;
    repoData?: RepoData | CreateNewResource;
    branchData?: BranchData | CreateNewResource;

    repoHtmlUrl?: string;
    fsPath?: string;

    newStaticWebAppName?: string;

    newRepoName?: string;
    newRepoIsPrivate?: boolean;
    newRemoteShortname?: string;
    originExists?: boolean;
    gitignoreExists?: boolean;

    // prefill the input boxes with preset build values;
    // projects are too flexible for us to force users to use these values
    presetAppLocation?: string;
    presetApiLocation?: string;
    presetOutputLocation?: string;

    appLocation?: string;
    apiLocation?: string;
    outputLocation?: string;
    // created when the wizard is done executing
    staticWebApp?: WebSiteManagementModels.StaticSiteARMResource;
}
