/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "vscode-azureextensionui";
import { appSubpathSetting } from "../../constants";
import { ext } from "../../extensionVariables";
import { getGitTreeQuickPicks } from "../../utils/gitHubUtils";
import { localize } from "../../utils/localize";
import { nonNullProp } from "../../utils/nonNull";
import { getWorkspaceSetting } from "../../utils/settingsUtils";
import { addLocationTelemetry } from "./addLocationTelemetry";
import { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";

export class AppLocationStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    public async prompt(wizardContext: IStaticWebAppWizardContext): Promise<void> {
        const defaultLocation: string = '/';

        const placeHolder: string = localize('appLocation', "Select the location of your application code");
        wizardContext.appLocation = (await ext.ui.showQuickPick(
            await getGitTreeQuickPicks(
                nonNullProp(wizardContext, 'gitTreeData'),
                getWorkspaceSetting(appSubpathSetting, wizardContext.fsPath)),
            { placeHolder, suppressPersistence: true })).label.trim();

        addLocationTelemetry(wizardContext, 'appLocation', defaultLocation);
    }

    public shouldPrompt(wizardContext: IStaticWebAppWizardContext): boolean {
        return !wizardContext.appLocation;
    }
}
