/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "vscode-azureextensionui";
import { ext } from "../../extensionVariables";
import { localize } from "../../utils/localize";
import { IStaticSiteWizardContext } from "./IStaticSiteWizardContext";

export class ApiLocationStep extends AzureWizardPromptStep<IStaticSiteWizardContext> {
    public async prompt(wizardContext: IStaticSiteWizardContext): Promise<void> {
        wizardContext.apiLocation = (await ext.ui.showInputBox({
            value: 'api',
            prompt: localize('apiLocation', 'Enter the API directory')
        })).trim();
    }

    public shouldPrompt(wizardContext: IStaticSiteWizardContext): boolean {
        return !wizardContext.apiLocation;
    }

}
