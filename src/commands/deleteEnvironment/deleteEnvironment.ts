/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizard, createSubscriptionContext, IActionContext, ISubscriptionContext } from '@microsoft/vscode-azext-utils';
import { EnvironmentItem } from '../../tree/v2/EnvironmentItem';
import { createActivityContext } from '../../utils/activityUtils';
import { localize } from '../../utils/localize';
import { pickEnvironment } from '../../utils/pickItem/pickEnvironment';
import { EnvironmentDeleteConfirmStep } from './EnvironmentDeleteConfirmStep';
import { EnvironmentDeleteContext } from './EnvironmentDeleteContext';
import { EnvironmentDeleteStep } from './EnvironmentDeleteStep';

export async function deleteEnvironment(context: IActionContext, item?: EnvironmentItem): Promise<void> {
    item ??= await pickEnvironment(context);

    if (item.isProduction) {
        context.errorHandling.suppressReportIssue = true;
        throw new Error(localize('cantDeletePro', 'Cannot delete the production environment directly. Delete the static web app.'));
    }

    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(item.subscription);
    const wizardContext: EnvironmentDeleteContext = {
        ...context,
        ...subscriptionContext,
        ...await createActivityContext(),
        subscription: item.subscription,
        environmentName: item.label,
        staticSiteBuild: item.staticSiteBuild,
        staticWebApp: item.staticWebApp,
    };

    const wizard: AzureWizard<EnvironmentDeleteContext> = new AzureWizard(wizardContext, {
        title: localize('deleteEnvironmentTitle', 'Delete environment "{0}" of static web app "{1}"', wizardContext.environmentName, wizardContext.staticWebApp?.name),
        promptSteps: [
            new EnvironmentDeleteConfirmStep(),
        ],
        executeSteps: [
            new EnvironmentDeleteStep(),
        ],
    });

    await wizard.prompt();
    await wizard.execute();
}
