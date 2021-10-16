/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, IActionContext } from "vscode-azureextensionui";
import { tryGetStaticWebAppsCliConfig } from "../../cli/tryGetStaticWebAppsCliConfig";
import { minSwaCliVersion } from "../../constants";
import { NoWorkspaceError } from "../../errors";
import { localize } from "../../utils/localize";
import { tryGetWorkspaceFolder } from "../../utils/workspaceUtils";
import { CreateStaticWebAppsCliConfigStep } from "../cli/config/CreateStaticWebAppsCliConfigStep";
import { RunCommandStep } from "../cli/config/RunCommandStep";
import { validateSwaCliInstalled } from "../cli/validateSwaCliInstalled";
import { AppLocationStep } from "../createStaticWebApp/AppLocationStep";
import { BuildPresetListStep } from "../createStaticWebApp/BuildPresetListStep";
import { tryGetApiLocations } from "../createStaticWebApp/tryGetApiLocations";
import { DebugApiLocationStep } from "./DebugApiLocationStep";
import { ILocalProjectWizardContext } from "./ILocalProjectWizardContext";
import { InitProjectForVSCodeStep } from "./InitProjectForVSCodeStep";
import { PickConfigurationStep } from "./PickConfigurationStep";

export async function initProjectForVSCode(context: IActionContext): Promise<void> {
    const workspaceFolder = await tryGetWorkspaceFolder(context);
    if (!workspaceFolder) {
        throw new NoWorkspaceError();
    }

    const message = localize('installSwaCli', 'You must have the Azure Static Web Apps CLI version {0} or newer installed to initialize your static web app for debugging.', minSwaCliVersion);
    if (!await validateSwaCliInstalled(context, message, minSwaCliVersion)) {
        return;
    }
    const wizardContext: ILocalProjectWizardContext = { ...context, fsPath: workspaceFolder.uri.fsPath, workspaceFolder };
    wizardContext.detectedApiLocations = await tryGetApiLocations(context, workspaceFolder);

    const promptSteps: AzureWizardPromptStep<ILocalProjectWizardContext>[] = [];
    const executeSteps: AzureWizardExecuteStep<ILocalProjectWizardContext>[] = [];

    const swaCliConfigFile = await tryGetStaticWebAppsCliConfig(context, workspaceFolder.uri);
    if (!swaCliConfigFile || !Object.keys(swaCliConfigFile.configurations ?? []).length) {
        promptSteps.push(new AppLocationStep(), new BuildPresetListStep(), new RunCommandStep(), new DebugApiLocationStep());
        executeSteps.push(new CreateStaticWebAppsCliConfigStep());
    } else {
        promptSteps.push(new PickConfigurationStep(), new DebugApiLocationStep());
    }

    const wizard = new AzureWizard<ILocalProjectWizardContext>({ ...wizardContext, swaCliConfigFile }, {
        title: localize('setupSwaDebugging', 'Setup Static Web App debugging'),
        promptSteps,
        executeSteps: [...executeSteps, new InitProjectForVSCodeStep()],
        showLoadingPrompt: true
    });
    await wizard.prompt();
    await wizard.execute();
}
