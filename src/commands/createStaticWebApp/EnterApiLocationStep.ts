/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "vscode-azureextensionui";
import { apiSubpathSetting, defaultApiLocation } from "../../constants";
import { ext } from "../../extensionVariables";
import { localize } from "../../utils/localize";
import { getWorkspaceSetting } from "../../utils/settingsUtils";
import { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";

export class EnterApiLocationStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    public async prompt(context: IStaticWebAppWizardContext): Promise<void> {
        context.apiLocation = (await ext.ui.showInputBox({
            value: getWorkspaceSetting(apiSubpathSetting, context.fsPath) || defaultApiLocation,
            prompt: localize('enterApiLocation', "Enter the location of your Azure Functions code (Leave blank for no Azure Functions code)"),
        })).trim();
    }

    public shouldPrompt(context: IStaticWebAppWizardContext): boolean {
        return !!context.manuallyEnterApi;
    }
}
