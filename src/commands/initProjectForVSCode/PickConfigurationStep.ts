/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "vscode-azureextensionui";
import { localize } from "../../utils/localize";
import { nonNullValueAndProp } from "../../utils/nonNull";
import { ILocalProjectWizardContext } from "./ILocalProjectWizardContext";

export class PickConfigurationStep extends AzureWizardPromptStep<ILocalProjectWizardContext> {
    public async prompt(wizardContext: ILocalProjectWizardContext): Promise<void> {
        const configurations = nonNullValueAndProp(wizardContext.swaCliConfigFile, 'configurations');
        const configurationNames: string[] = Object.keys(configurations);

        const configurationName = configurationNames.length === 1 ? configurationNames[0] : (await wizardContext.ui.showQuickPick(configurationNames.map((name) => ({ label: name })), {
            placeHolder: localize('pickSwaCliConfig', 'Select the Static Web Apps CLI configuration to use.')
        })).label;

        const options = configurations[configurationName];
        wizardContext.appLocation = options.appLocation ?? '/';

        wizardContext.swaCliConfig = {
            name: configurationName,
            options: options
        }
    }

    public shouldPrompt(wizardContext: ILocalProjectWizardContext): boolean {
        return !wizardContext.swaCliConfig;
    }
}
