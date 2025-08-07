/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import  { type SkuDescription, type StaticSiteARMResource, type WebSiteManagementClient } from '@azure/arm-appservice';
import  { type IResourceGroupWizardContext } from '@microsoft/vscode-azext-azureutils';
import  { type ExecuteActivityContext } from '@microsoft/vscode-azext-utils';
import  { type Uri } from 'vscode';
import  { type IBuildPreset } from '../../buildPresets/IBuildPreset';
import  { type Repository } from '../../git';
import  { type BranchData, type ListOrgsForUserData, type OrgForAuthenticatedUserData } from '../../gitHubTypings';

export interface IStaticWebAppWizardContext extends IResourceGroupWizardContext, ExecuteActivityContext {
    advancedCreation?: boolean;
    accessToken: string;
    client: WebSiteManagementClient;

    orgData?: OrgForAuthenticatedUserData | ListOrgsForUserData;
    branchData?: Partial<BranchData>;
    repoHtmlUrl?: string;

    repo?: Repository;
    uri?: Uri;

    // Function projects detected via host.json at SWA create time
    detectedApiLocations?: string[];

    newStaticWebAppName?: string;

    newRepoName?: string;
    newRepoIsPrivate?: boolean;
    newRemoteShortname?: string;

    originExists?: boolean;

    // prefill the input boxes with preset build values;
    // projects are too flexible for us to force users to use these values
    buildPreset?: IBuildPreset;

    appLocation?: string;
    apiLocation?: string;
    outputLocation?: string;

    sku?: SkuDescription;

    // created when the wizard is done executing
    staticWebApp?: StaticSiteARMResource;
}
