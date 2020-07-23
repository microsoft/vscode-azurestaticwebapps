/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "vscode-azureextensionui";
import { apiSubpathSetting, defaultApiName, skipForNowQuickPickItem } from "../../constants";
import { ext } from "../../extensionVariables";
import { getGitTreeQuickPicks } from "../../utils/gitHubUtils";
import { localize } from "../../utils/localize";
import { nonNullProp } from "../../utils/nonNull";
import { getWorkspaceSetting } from "../../utils/settingsUtils";
import { addLocationTelemetry } from "./addLocationTelemetry";
import { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";

export class ApiLocationStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    public async prompt(wizardContext: IStaticWebAppWizardContext): Promise<void> {
        const placeHolder: string = localize('apiLocation', "Enter the location of your Azure Functions code");
        const input: string = (await ext.ui.showQuickPick(
            await getGitTreeQuickPicks(
                nonNullProp(wizardContext, 'gitTreeData'),
                getWorkspaceSetting(apiSubpathSetting, wizardContext.fsPath),
                true),
            { placeHolder, suppressPersistence: true })).label.trim();

        // entering a blank in the request is the same as skipping this step
        wizardContext.apiLocation = input === skipForNowQuickPickItem.label ? '' : input;
        addLocationTelemetry(wizardContext, 'apiLocation', defaultApiName);
    }

    public shouldPrompt(wizardContext: IStaticWebAppWizardContext): boolean {
        return !wizardContext.apiLocation;
    }

}
