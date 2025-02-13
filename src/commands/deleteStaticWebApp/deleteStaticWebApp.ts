/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizard, createSubscriptionContext, IActionContext, ISubscriptionContext } from '@microsoft/vscode-azext-utils';
import { ext } from '../../extensionVariables';
import { StaticWebAppItem } from '../../tree/v2/StaticWebAppItem';
import { createActivityContext } from '../../utils/activityUtils';
import { localize } from '../../utils/localize';
import { pickStaticWebApp } from '../../utils/pickItem/pickStaticWebApp';
import { ResourceGroupDeleteStep } from './ResourceGroupDeleteStep';
import { StaticWebAppDeleteConfirmStep } from './StaticWebAppDeleteConfirmStep';
import { StaticWebAppDeleteContext } from './StaticWebAppDeleteContext';
import { StaticWebAppDeleteStep } from './StaticWebAppDeleteStep';

export async function deleteStaticWebApp(context: IActionContext, item?: StaticWebAppItem): Promise<void> {
    item ??= await pickStaticWebApp(context);

    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(item.subscription);
    const wizardContext: StaticWebAppDeleteContext = {
        ...context,
        ...subscriptionContext,
        ...await createActivityContext(),
        subscription: item.subscription,
        staticWebApp: item.staticWebApp,
    };

    const wizard = new AzureWizard<StaticWebAppDeleteContext>(wizardContext, {
        title: localize('deleteSwaTitle', 'Delete static web app "{0}"', wizardContext.staticWebApp.name),
        promptSteps: [
            new StaticWebAppDeleteConfirmStep(),
        ],
        executeSteps: [
            new StaticWebAppDeleteStep(),
            new ResourceGroupDeleteStep(),
        ],
    });

    await wizard.prompt();
    await wizard.execute();

    ext.branchDataProvider.refresh();
}
