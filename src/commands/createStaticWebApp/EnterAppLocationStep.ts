/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "vscode-azureextensionui";
import { appSubpathSetting, defaultAppLocation } from "../../constants";
import { ext } from "../../extensionVariables";
import { localize } from "../../utils/localize";
import { getWorkspaceSetting } from "../../utils/settingsUtils";
import { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";

export class EnterAppLocationStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    public async prompt(context: IStaticWebAppWizardContext): Promise<void> {
        context.appLocation = (await ext.ui.showInputBox({
            value: getWorkspaceSetting(appSubpathSetting, context.fsPath) || defaultAppLocation,
            prompt: localize('enterAppLocation', "Enter the location of your application code. For example, '/' represents the root of your app, while '/app' represents a directory called 'app'.")
        })).trim();
    }

    public shouldPrompt(context: IStaticWebAppWizardContext): boolean {
        return context.appLocation === undefined;
    }
}
