/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IWizardOptions } from "vscode-azureextensionui";
import { defaultApiLocation } from "../../constants";
import { ext } from "../../extensionVariables";
import { getGitTreeQuickPicks } from "../../utils/gitHubUtils";
import { localize } from "../../utils/localize";
import { addLocationTelemetry } from "./addLocationTelemetry";
import { EnterApiLocationStep } from "./EnterApiLocationStep";
import { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";

export class ApiLocationStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    public async prompt(wizardContext: IStaticWebAppWizardContext): Promise<void> {
        const placeHolder: string = localize('apiLocation', "Select the location of your Azure Functions code");
        wizardContext.apiLocation = (await ext.ui.showQuickPick(getGitTreeQuickPicks(wizardContext, true), { placeHolder, suppressPersistence: true })).data;

        addLocationTelemetry(wizardContext, 'apiLocation', defaultApiLocation);
    }

    public shouldPrompt(wizardContext: IStaticWebAppWizardContext): boolean {
        return !wizardContext.apiLocation && !wizardContext.newRepoName;
    }

    public async getSubWizard(wizardContext: IStaticWebAppWizardContext): Promise<IWizardOptions<IStaticWebAppWizardContext> | undefined> {
        return wizardContext.apiLocation === undefined ? { promptSteps: [new EnterApiLocationStep()] } : undefined;

    }

}
