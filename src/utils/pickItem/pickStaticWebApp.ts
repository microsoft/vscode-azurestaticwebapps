/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ContextValueQuickPickStep, QuickPickAzureSubscriptionStep, QuickPickGroupStep, runQuickPickWizard, type AzureResourceQuickPickWizardContext, type AzureWizardPromptStep, type IActionContext, type QuickPickWizardContext } from "@microsoft/vscode-azext-utils";
import { AzExtResourceType, type ResourceGroupsTreeDataProvider } from "@microsoft/vscode-azureresources-api";
import { ext } from "../../extensionVariables";
import { StaticWebAppItem } from "../../tree/v2/StaticWebAppItem";
import { localize } from "../localize";
import { PickItemOptions } from "./PIckItemOptions";

export function getPickStaticWebAppSteps(): AzureWizardPromptStep<AzureResourceQuickPickWizardContext>[] {
    const tdp: ResourceGroupsTreeDataProvider = ext.rgApiV2.resources.azureResourceTreeDataProvider;

    return [
        new QuickPickAzureSubscriptionStep(tdp),
        new QuickPickGroupStep(tdp, {
            groupType: [AzExtResourceType.StaticWebApps],
        }),
        new ContextValueQuickPickStep(ext.rgApiV2.resources.azureResourceTreeDataProvider, {
            contextValueFilter: { include: StaticWebAppItem.contextValue },
        }, {
            placeHolder: localize('selectStaticWebApp', 'Select a static web app'),
            noPicksMessage: localize('noStaticWebApp', 'Current subscription has no static web apps'),
        }),
    ];
}

export async function pickStaticWebApp(context: IActionContext, options?: PickItemOptions): Promise<StaticWebAppItem> {
    const promptSteps: AzureWizardPromptStep<QuickPickWizardContext>[] = [
        ...getPickStaticWebAppSteps()
    ];

    return await runQuickPickWizard(context, {
        promptSteps,
        title: options?.title,
        showLoadingPrompt: options?.showLoadingPrompt,
    });
}
