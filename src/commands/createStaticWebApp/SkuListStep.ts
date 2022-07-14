/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { SkuDescription } from '@azure/arm-appservice';
import { AzureWizardPromptStep, IAzureQuickPickItem, nonNullProp } from '@microsoft/vscode-azext-utils';
import { localize } from '../../utils/localize';
import { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";

export class SkuListStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    public async prompt(context: IStaticWebAppWizardContext): Promise<void> {
        const skus: IAzureQuickPickItem<SkuDescription>[] = SkuListStep.getSkus().map(s => {
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

    public static getSkus(): (SkuDescription & { description: string, detail: string })[] {
        // seems incomplete, but only name/tier are necessary for the SiteEnvelope to pick the right sku
        return [
            {
                name: 'Free',
                tier: 'Free',
                description: localize('freeSkuDescription', 'For hobbies/personal projects'),
                detail: localize('freeSkuDetail', 'Free SSL, 2 Custom Domains')
            },
            {
                name: 'Standard',
                tier: 'Standard',
                description: localize('standardSkuDescription', 'For general purpose production app'),
                detail: localize('standardSkuDetail', 'Free SSL, 5 Custom Domains, Custom Authentication, SLA')
            }
        ];
    }
}
