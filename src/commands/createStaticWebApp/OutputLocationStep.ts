/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "vscode-azureextensionui";
import { appArtifactSubpathSetting, outputSubpathSetting } from "../../constants";
import { ext } from "../../extensionVariables";
import { localize } from "../../utils/localize";
import { getWorkspaceSetting } from "../../utils/settingsUtils";
import { addLocationTelemetry } from "./addLocationTelemetry";
import { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";

export class OutputLocationStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    public async prompt(wizardContext: IStaticWebAppWizardContext): Promise<void> {
        const defaultValue: string = wizardContext.presetOutputLocation || 'build';
        const workspaceSetting: string | undefined = getWorkspaceSetting(outputSubpathSetting, wizardContext.fsPath);

        wizardContext.outputLocation = (await ext.ui.showInputBox({
            value: workspaceSetting || getWorkspaceSetting(appArtifactSubpathSetting, wizardContext.fsPath) || defaultValue,
            prompt: localize('publishLocation', "Enter the location of your build output relative to your app's location or leave blank if it has no build. For example, setting a value of 'build' when your app location is set to 'app' will cause the content at 'app/build' to be served.")
        })).trim();

        addLocationTelemetry(wizardContext, 'outputLocation', defaultValue, workspaceSetting);
    }

    public shouldPrompt(wizardContext: IStaticWebAppWizardContext): boolean {
        return !wizardContext.outputLocation;
    }

}
