/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizard, IActionContext } from "vscode-azureextensionui";
import { tryGetStaticWebAppsCliConfig } from "../../cli/tryGetStaticWebAppsCliConfig";
import { minSwaCliVersion } from "../../constants";
import { localize } from "../../utils/localize";
import { tryGetWorkspaceFolder } from "../../utils/workspaceUtils";
import { validateSwaCliInstalled } from "../cli/validateSwaCliInstalled";
import { tryGetApiLocations } from "../createStaticWebApp/tryGetApiLocations";
import { DebugApiLocationStep } from "./DebugApiLocationStep";
import { ILocalProjectWizardContext } from "./ILocalProjectWizardContext";
import { InitProjectForVSCodeStep } from "./InitProjectForVSCodeStep";
import { PickConfigurationStep } from "./PickConfigurationStep";

export async function initProjectForVSCode(context: IActionContext): Promise<void> {
    const workspaceFolder = await tryGetWorkspaceFolder(context);
    if (!workspaceFolder) {
        return;
    }

    const message = localize('installSwaCli', 'You must have the Azure Static Web Apps CLI version {0} installed to initialize your static web app for debugging.', minSwaCliVersion);
    if (!await validateSwaCliInstalled(context, message)) {
        return;
    }

    const swaCliConfigFile = await tryGetStaticWebAppsCliConfig(workspaceFolder.uri);
    if (!swaCliConfigFile || !Object.keys(swaCliConfigFile.configurations ?? []).length) {
        // For now do nothing, will implement creating a swa-cli.config.json interactively in the future.
        return;
    }

    const wizardContext: ILocalProjectWizardContext = { ...context, fsPath: workspaceFolder.uri.fsPath, workspaceFolder, swaCliConfigFile };
    wizardContext.detectedApiLocations = await tryGetApiLocations(context, workspaceFolder);
    const wizard = new AzureWizard<ILocalProjectWizardContext>(wizardContext, {
        promptSteps: [new PickConfigurationStep(), new DebugApiLocationStep()],
        executeSteps: [new InitProjectForVSCodeStep()]
    });
    await wizard.prompt();
    await wizard.execute();
}
