/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { angularOutputLocation, appArtifactSubpathSetting, outputSubpathSetting } from "../../constants";
import { localize } from "../../utils/localize";
import { getWorkspaceSetting } from "../../utils/settingsUtils";
import { validateLocationYaml } from "../../utils/yamlUtils";
import { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";
import { addLocationTelemetry } from "./addLocationTelemetry";

export class OutputLocationStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    public async prompt(context: IStaticWebAppWizardContext): Promise<void> {
        const defaultValue: string = context.buildPreset?.outputLocation ?? 'build';
        const workspaceSetting: string | undefined = getWorkspaceSetting(outputSubpathSetting, context.uri);

        context.outputLocation = (await context.ui.showInputBox({
            value: workspaceSetting || getWorkspaceSetting(appArtifactSubpathSetting, context.uri) || defaultValue,
            prompt: localize('publishLocation', "Enter the location of your build output relative to your app's location or leave blank if it has no build. For example, setting a value of 'build' when your app location is set to 'app' will cause the content at 'app/build' to be served."),
            learnMoreLink: 'https://aka.ms/SwaOutLoc',
            validateInput: (value: string): string | undefined => {
                if (value === angularOutputLocation) {
                    return localize('fillProjectName', 'Fill in the name of your Angular project.')
                }
                return validateLocationYaml(value, 'output_location');
            }
        })).trim();

        addLocationTelemetry(context, 'outputLocation', defaultValue, workspaceSetting);
    }

    public shouldPrompt(context: IStaticWebAppWizardContext): boolean {
        return !context.outputLocation;
    }

}
