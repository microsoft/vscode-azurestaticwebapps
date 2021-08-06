/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementModels } from '@azure/arm-appservice';
import { AzureWizardPromptStep, IAzureQuickPickItem } from 'vscode-azureextensionui';
import { freeSkuDescription, freeSkuDetail, standardSkuDescription, standardSkuDetail } from '../../constants';
import { localize } from '../../utils/localize';
import { nonNullProp } from '../../utils/nonNull';
import { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";

export class SkuListStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    public async prompt(context: IStaticWebAppWizardContext): Promise<void> {
        const skus: IAzureQuickPickItem<WebSiteManagementModels.SkuDescription>[] = SkuListStep.getSkus().map(s => {
            return {
                label: nonNullProp(s, 'name'),
                detail: s.detail,
                description: s.description,
                data: s
            };
        });

        const placeHolder: string = localize('selectPricingOption', 'Select pricing option');
        context.sku = (await context.ui.showQuickPick(skus, { placeHolder, suppressPersistence: true })).data;
    }

    public shouldPrompt(context: IStaticWebAppWizardContext): boolean {
        return !context.sku;
    }

    public static getSkus(): (WebSiteManagementModels.SkuDescription & { description: string, detail: string })[] {
        // seems incomplete, but only name/tier are necessary for the SiteEnvelope to pick the right sku
        return [
            {
                name: 'Free',
                tier: 'Free',
                description: freeSkuDescription,
                detail: freeSkuDetail
            },
            {
                name: 'Standard',
                tier: 'Standard',
                description: standardSkuDescription,
                detail: standardSkuDetail
            }
        ];
    }
}
