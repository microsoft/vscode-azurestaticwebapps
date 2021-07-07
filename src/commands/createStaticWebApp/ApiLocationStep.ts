/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "vscode-azureextensionui";
import { apiSubpathSetting, defaultApiLocation } from "../../constants";
import { ext } from "../../extensionVariables";
import { localize } from "../../utils/localize";
import { getWorkspaceSetting } from "../../utils/settingsUtils";
import { addLocationTelemetry } from "./addLocationTelemetry";
import { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";

export class ApiLocationStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    public async prompt(context: IStaticWebAppWizardContext): Promise<void> {
        const defaultValue: string = context.buildPreset?.apiLocation ?? defaultApiLocation;
        const workspaceSetting: string | undefined = getWorkspaceSetting(apiSubpathSetting, context.fsPath);

        context.apiLocation = (await ext.ui.showInputBox({
            value: workspaceSetting || defaultValue,
            prompt: localize('enterApiLocation', "Enter the location of your Azure Functions code or leave blank to skip this step. For example, 'api' represents a folder called 'api'."),
        })).trim();

        addLocationTelemetry(context, 'apiLocation', defaultValue, workspaceSetting);
    }

    public shouldPrompt(context: IStaticWebAppWizardContext): boolean {
        if (!context.advancedCreation) {
            context.apiLocation = context.buildPreset?.apiLocation ?? defaultApiLocation;
        }

        return context.apiLocation === undefined;
    }
}
