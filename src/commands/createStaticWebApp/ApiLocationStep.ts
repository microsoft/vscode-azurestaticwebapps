/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { apiSubpathSetting, defaultApiLocation } from "../../constants";
import { localize } from "../../utils/localize";
import { getWorkspaceSetting } from "../../utils/settingsUtils";
import { validateLocationYaml } from "../../utils/yamlUtils";
import { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";
import { addLocationTelemetry } from "./addLocationTelemetry";
import { promptForApiFolder } from "./tryGetApiLocations";

export class ApiLocationStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    public async prompt(context: IStaticWebAppWizardContext): Promise<void> {
        const defaultValue: string = context.buildPreset?.apiLocation ?? defaultApiLocation;
        const workspaceSetting: string | undefined = getWorkspaceSetting(apiSubpathSetting, context.uri);

        context.apiLocation = context.detectedApiLocations?.length ?
            await promptForApiFolder(context, context.detectedApiLocations) :
            (await context.ui.showInputBox({
                value: workspaceSetting || defaultValue,
                validateInput: (value) => validateLocationYaml(value, 'api_location'),
                learnMoreLink: 'https://aka.ms/SwaApiLoc',
                prompt: localize('enterApiLocation', "Enter the location of your Azure Functions code or leave blank to skip this step. For example, 'api' represents a folder called 'api'."),
            })).trim();

        addLocationTelemetry(context, 'apiLocation', defaultValue, workspaceSetting);
    }

    public shouldPrompt(context: IStaticWebAppWizardContext): boolean {
        if (context.detectedApiLocations?.length === 1) {
            context.apiLocation = context.detectedApiLocations[0];
        } else if (!context.advancedCreation && !context.detectedApiLocations?.length) {
            context.apiLocation = context.buildPreset?.apiLocation ?? defaultApiLocation;
        }

        return context.apiLocation === undefined;
    }
}
