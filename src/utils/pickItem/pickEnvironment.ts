/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureResourceQuickPickWizardContext, ContextValueQuickPickStep, runQuickPickWizard, type AzureWizardPromptStep, type IActionContext, type QuickPickWizardContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import { EnvironmentItem } from "../../tree/v2/EnvironmentItem";
import { localize } from "../localize";
import { PickItemOptions } from "./PIckItemOptions";
import { getPickStaticWebAppSteps } from "./pickStaticWebApp";

export function getPickEnvironmentStep(): AzureWizardPromptStep<AzureResourceQuickPickWizardContext> {
    return new ContextValueQuickPickStep(ext.rgApiV2.resources.azureResourceTreeDataProvider, {
        contextValueFilter: { include: EnvironmentItem.contextValue },
        skipIfOne: true,
    }, {
        placeHolder: localize('selectEnvironment', 'Select an environment'),
    });
}

export async function pickEnvironment(context: IActionContext, options?: PickItemOptions): Promise<EnvironmentItem> {
    const promptSteps: AzureWizardPromptStep<QuickPickWizardContext>[] = [
        ...getPickStaticWebAppSteps(),
        getPickEnvironmentStep(),
    ];

    return await runQuickPickWizard(context, {
        promptSteps,
        title: options?.title,
        showLoadingPrompt: options?.showLoadingPrompt,
    });
}
