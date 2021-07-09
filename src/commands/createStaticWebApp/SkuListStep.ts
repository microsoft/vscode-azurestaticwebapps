/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementModels } from '@azure/arm-appservice';
import { AzureWizardPromptStep, IAzureQuickPickItem } from 'vscode-azureextensionui';
import { localize } from '../../utils/localize';
import { nonNullProp } from '../../utils/nonNull';
import { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";

export class SkuListStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    public async prompt(context: IStaticWebAppWizardContext): Promise<void> {
        const skus: IAzureQuickPickItem<WebSiteManagementModels.SkuDescription>[] = SkuListStep.getSkus().map(s => {
            return {
                label: nonNullProp(s, 'name'),
                data: s
            };
        });

        const placeHolder: string = localize('selectSku', 'Select a sku');
        context.sku = (await context.ui.showQuickPick(skus, { placeHolder, suppressPersistence: true })).data;
    }

    public shouldPrompt(context: IStaticWebAppWizardContext): boolean {
        return !context.sku;
    }

    public static getSkus(): WebSiteManagementModels.SkuDescription[] {
        // seems incomplete, but only name/tier are necessary for the SiteEnvelope to pick the right sku
        return [
            {
                name: 'Free',
                tier: 'Free',
            },
            {
                name: 'Standard',
                tier: 'Standard',
            }];
    }
}
