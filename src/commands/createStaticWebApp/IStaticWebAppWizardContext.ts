/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementClient, WebSiteManagementModels } from '@azure/arm-appservice';
import { ICreateChildImplContext, IResourceGroupWizardContext } from 'vscode-azureextensionui';
import { IBuildPreset } from '../../buildPresets/IBuildPreset';
import { Repository } from '../../git';
import { BranchData, ListOrgsForUserData, OrgForAuthenticatedUserData } from '../../gitHubTypings';
import { ILocalProjectWizardContext } from '../initProjectForVSCode/ILocalProjectWizardContext';

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

    // prefill the input boxes with preset build values;
    // projects are too flexible for us to force users to use these values
    buildPreset?: IBuildPreset;

    outputLocation?: string;

    sku?: WebSiteManagementModels.SkuDescription;

    // created when the wizard is done executing
    staticWebApp?: WebSiteManagementModels.StaticSiteARMResource;
}
