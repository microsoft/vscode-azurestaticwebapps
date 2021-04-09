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
        const defaultValue: string = context.presetApiLocation || defaultApiLocation;

        context.apiLocation = (await ext.ui.showInputBox({
            value: getWorkspaceSetting(apiSubpathSetting, context.fsPath) || defaultValue,
            prompt: localize('enterApiLocation', "Enter the location of your Azure Functions code or leave blank to skip this step. For example, 'api' represents a folder called 'api'."),
        })).trim();

        addLocationTelemetry(context, 'apiLocation', defaultValue);
    }

    public shouldPrompt(context: IStaticWebAppWizardContext): boolean {
        return context.apiLocation === undefined;
    }
}
