/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IWizardOptions } from "vscode-azureextensionui";
import { defaultAppLocation } from "../../constants";
import { ext } from "../../extensionVariables";
import { getGitTreeQuickPicks } from "../../utils/gitHubUtils";
import { localize } from "../../utils/localize";
import { addLocationTelemetry } from "./addLocationTelemetry";
import { EnterAppLocationStep } from "./EnterAppLocationStep";
import { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";

export class AppLocationStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    public async prompt(wizardContext: IStaticWebAppWizardContext): Promise<void> {
        const placeHolder: string = localize('appLocation', "Select the location of your application code");
        wizardContext.appLocation = (await ext.ui.showQuickPick(getGitTreeQuickPicks(wizardContext), { placeHolder, suppressPersistence: true })).data;

        addLocationTelemetry(wizardContext, 'appLocation', defaultAppLocation);
    }

    public shouldPrompt(wizardContext: IStaticWebAppWizardContext): boolean {
        return !wizardContext.appLocation;
    }

    public async getSubWizard(wizardContext: IStaticWebAppWizardContext): Promise<IWizardOptions<IStaticWebAppWizardContext> | undefined> {
        return wizardContext.appLocation === undefined ? { promptSteps: [new EnterAppLocationStep()] } : undefined;
    }
}
