/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { gitHubOrgData } from '../../github/connectToGitHub';
import { IGitHubAccessTokenContext } from '../../IGitHubAccessTokenContext';

export interface INewEndpointWizardContext extends IGitHubAccessTokenContext {
    orgData?: gitHubOrgData;
    newRepoName?: string;
}
