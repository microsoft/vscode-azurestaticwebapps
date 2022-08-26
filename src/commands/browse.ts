/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtResourceType, AzureWizard, IActionContext, nonNullValue } from '@microsoft/vscode-azext-utils';
import { TreeDataProvider } from 'vscode';
import { AppResourceFilter } from '../AppResourceFilter';
import { ContextValueFilter } from '../ContextValueFilter';
import { ext } from '../extensionVariables';
import { QuickPickAppResourceStep } from '../quickPickWizard/QuickPickAppResourceStep';
import { QuickPickAppResourceWizardContext } from '../quickPickWizard/QuickPickAppResourceWizardContext';
import { QuickPickSubscriptionStep } from '../quickPickWizard/QuickPickSubscriptionStep';
import { getLastNode } from '../quickPickWizard/QuickPickWizardContext';
import { EnvironmentItem } from '../tree/EnvironmentItem';
import { StaticWebAppItem } from '../tree/StaticWebAppItem';
import { ResourceGroupsItem } from '../vscode-azureresourcegroups.api.v2';

export async function browse(context: IActionContext, node?: StaticWebAppItem | EnvironmentItem): Promise<void> {
    if (!node) {
        node = await ext.rgApiv2.pickResource2<EnvironmentItem>(async (tdp: TreeDataProvider<ResourceGroupsItem>): Promise<EnvironmentItem> => {
            const promptSteps = [
                new QuickPickSubscriptionStep(),
                new QuickPickAppResourceStep(tdp, new AppResourceFilter(AzExtResourceType.StaticWebApps), {
                    childFilter: new ContextValueFilter('azureStaticEnvironment')
                })
            ];

            const wizardContext: QuickPickAppResourceWizardContext<EnvironmentItem> = {
                ...context,
                pickedNodes: [],
                applicationSubscription: undefined,
                applicationResource: undefined,
            };

            const wizard = new AzureWizard(wizardContext, { hideStepCount: true, promptSteps, title: 'TODO' /* TODO: title */ });
            await wizard.prompt();
            await wizard.execute();

            return nonNullValue(getLastNode<EnvironmentItem>(wizardContext), 'lastNode');
        });
    }

    await node.browse();
}
