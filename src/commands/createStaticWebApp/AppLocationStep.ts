/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "vscode-azureextensionui";
import { ext } from "../../extensionVariables";
import { localize } from "../../utils/localize";
import { IStaticSiteWizardContext } from "./IStaticSiteWizardContext";

export class AppLocationStep extends AzureWizardPromptStep<IStaticSiteWizardContext> {
    public async prompt(wizardContext: IStaticSiteWizardContext): Promise<void> {
        wizardContext.appLocation = (await ext.ui.showInputBox({
            value: 'app',
            prompt: localize('appLocation', 'Enter the app directory'),
            placeHolder: 'Directory to change to before starting a build. This is where we will look for package.json/.nvmrc/etc.'
        })).trim();
    }

    public shouldPrompt(wizardContext: IStaticSiteWizardContext): boolean {
        return !wizardContext.appLocation;
    }

}
