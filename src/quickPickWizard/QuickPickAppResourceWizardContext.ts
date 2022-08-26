/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ApplicationResource, ApplicationSubscription, ResourceGroupsItem } from '../vscode-azureresourcegroups.api.v2';
import { QuickPickWizardContext } from './QuickPickWizardContext';

export interface QuickPickAppResourceWizardContext<TModel extends ResourceGroupsItem> extends QuickPickWizardContext<TModel> {
    applicationSubscription: ApplicationSubscription | undefined;
    applicationResource: ApplicationResource | undefined;
}
