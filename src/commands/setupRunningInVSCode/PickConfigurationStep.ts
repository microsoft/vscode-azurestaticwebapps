/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IWizardOptions } from "vscode-azureextensionui";
import { localize } from "../../utils/localize";
import { nonNullValueAndProp } from "../../utils/nonNull";
import { CreateStaticWebAppsCliConfigStep } from "../cli/config/CreateStaticWebAppsCliConfigStep";
import { RunCommandStep } from "../cli/config/RunCommandStep";
import { AppLocationStep } from "../createStaticWebApp/AppLocationStep";
import { BuildPresetListStep } from "../createStaticWebApp/BuildPresetListStep";
import { DebugApiLocationStep } from "./DebugApiLocationStep";
import { ILocalProjectWizardContext } from "./ILocalProjectWizardContext";

export class PickConfigurationStep extends AzureWizardPromptStep<ILocalProjectWizardContext> {
    public async prompt(wizardContext: ILocalProjectWizardContext): Promise<void> {
        const configurations = nonNullValueAndProp(wizardContext.swaCliConfigFile, 'configurations');
        const createConfig: string = localize('newSwaCliConfig', '$(plus) Create new configuration');
        const configurationNames: string[] = [...Object.keys(configurations), createConfig];

        const configurationName = configurationNames.length === 1 ? configurationNames[0] : (await wizardContext.ui.showQuickPick(configurationNames.map((name) => ({ label: name })), {
            placeHolder: localize('pickSwaCliConfig', 'Select the Static Web Apps CLI configuration to setup.'),
            suppressPersistence: true
        })).label;

        if (configurationName !== createConfig) {
            const options = configurations[configurationName];
            wizardContext.appLocation = options.appLocation ?? '/';

            wizardContext.swaCliConfig = {
                name: configurationName,
                options: options
            }
        }
    }

    public shouldPrompt(wizardContext: ILocalProjectWizardContext): boolean {
        return !wizardContext.swaCliConfig;
    }

    public async getSubWizard(wizardContext: ILocalProjectWizardContext): Promise<IWizardOptions<ILocalProjectWizardContext> | undefined> {
        if (!wizardContext.swaCliConfig) {
            return {
                title: localize('createSwaCliConfig', 'Create new Azure Static Web Apps CLI configuration'),
                promptSteps: [new AppLocationStep(), new BuildPresetListStep(), new RunCommandStep(), new DebugApiLocationStep()],
                executeSteps: [new CreateStaticWebAppsCliConfigStep()]
            }
        }
        return undefined;
    }
}
