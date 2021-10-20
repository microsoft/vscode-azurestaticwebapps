/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { URL } from "url";
import { MessageItem } from "vscode";
import { AzureWizardPromptStep, IWizardOptions } from "vscode-azureextensionui";
import { SWACLIOptions } from "../../cli/tryGetStaticWebAppsCliConfig";
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

        let configurationName: string | undefined;
        let configError: string | undefined;
        while (!configurationName || configError) {
            configError = undefined;
            configurationName = (await wizardContext.ui.showQuickPick(configurationNames.map((name) => ({ label: name })), {
                placeHolder: localize('pickSwaCliConfig', 'Select the Static Web Apps CLI configuration to setup for running in VS Code.'),
                suppressPersistence: true
            })).label;

            if (configurationName !== createConfig) {
                configError = this.isConfigValidForDebugging(configurations[configurationName]);

                if (configError) {
                    const msg = localize('configMayNotWork', 'This configuration may not work with VS Code without recommended changes.\n\n') + configError;
                    const backAction: MessageItem = { title: 'Back' };
                    const continueAction: MessageItem = { title: localize('continueWith', "Continue with '{0}'...", configurationName) };
                    const action = await wizardContext.ui.showWarningMessage(msg, { learnMoreLink: 'https://aka.ms/setupSwaCliCode', modal: true }, continueAction, backAction);
                    if (action === backAction) {
                        configurationName = undefined;
                    } else if (action === continueAction) {
                        configError = undefined;
                    }
                }
            }
        }

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

    private isConfigValidForDebugging(options: SWACLIOptions): string | undefined {
        if (options.context) {
            if (!isValidUrl(options.context)) {
                return localize('contextIsNotUrl', "Configuration property 'context' should be the URL of your static web app development server. \nCurrent value: '{0}'\n Example value: 'http://localhost:3000'", options.context)
            }
        } else {
            return localize('missingContext', "Missing property 'context'. Value should be the URL of your static web app development server.\n Example value: 'http://localhost:3000'");
        }

        if (options.apiLocation && !isValidUrl(options.apiLocation)) {
            return localize('apiLocationIsNotUrl', "Configuration property 'apiLocation' should be the URL of your Functions API.\nCurrent value: '{0}'\nRecommended value: 'http://localhost:7071'", options.apiLocation);
        }

        return undefined;
    }
}

function isValidUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol.toLowerCase().startsWith('http');
    } catch (e) {
        return false;
    }
}
