/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtTreeItem, AzureWizard, IActionContext } from '@microsoft/vscode-azext-utils';
import { ext } from '../../extensionVariables';
import { ResolvedStaticWebAppTreeItem, StaticWebAppTreeItem } from '../../tree/StaticWebAppTreeItem';
import { localize } from '../../utils/localize';
import { ConfirmDeleteStep } from './ConfirmDeleteStep';
import { DeleteResourceGroupStep } from './DeleteResourceGroupStep';
import { IDeleteWizardContext } from './IDeleteWizardContext';
import { StaticWebAppDeleteStep } from './StaticWebAppDeleteStep';

export async function deleteStaticWebApp(context: IActionContext, node?: ResolvedStaticWebAppTreeItem & AzExtTreeItem): Promise<void> {
    if (!node) {
        node = await ext.rgApi.tree.showTreeItemPicker<ResolvedStaticWebAppTreeItem & AzExtTreeItem>(new RegExp(StaticWebAppTreeItem.contextValue), { ...context, suppressCreatePick: true });
    }

    const wizard = new AzureWizard<IDeleteWizardContext>({ ...context, node, subscription: node.subscription }, {
        title: localize('deleteSwa', 'Delete Static Web App "{0}"', node.name),
        promptSteps: [new ConfirmDeleteStep()],
        executeSteps: [new StaticWebAppDeleteStep(), new DeleteResourceGroupStep()],
    });

    await wizard.prompt();
    await wizard.execute({
        activity: {
            registerActivity: async (activity) => ext.rgApi.registerActivity(activity)
        }
    });
}
