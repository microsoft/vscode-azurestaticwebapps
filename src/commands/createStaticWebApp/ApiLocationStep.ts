/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "vscode-azureextensionui";
import { apiSubpathSetting, defaultApiName } from "../../constants";
import { ext } from "../../extensionVariables";
import { localize } from "../../utils/localize";
import { getWorkspaceSetting } from "../../utils/settingsUtils";
import { addLocationTelemetry } from "./addLocationTelemetry";
import { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";

export class ApiLocationStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    public async prompt(wizardContext: IStaticWebAppWizardContext): Promise<void> {
        wizardContext.apiLocation = (await ext.ui.showInputBox({
            value: getWorkspaceSetting(apiSubpathSetting, wizardContext.fsPath) || defaultApiName,
            prompt: localize('apiLocation', "Enter the location of your Azure Functions code (Leave blank for no Azure Functions code)"),
        })).trim();
        addLocationTelemetry(wizardContext, 'apiLocation', defaultApiName);
    }

    public shouldPrompt(wizardContext: IStaticWebAppWizardContext): boolean {
        return !wizardContext.apiLocation;
    }

}
