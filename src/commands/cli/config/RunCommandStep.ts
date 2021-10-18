/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "vscode-azureextensionui";
import { IBuildPreset } from "../../../buildPresets/IBuildPreset";
import { localize } from "../../../utils/localize";
import { nonNullProp } from "../../../utils/nonNull";
import { ILocalProjectWizardContext } from "../../initProjectForVSCode/ILocalProjectWizardContext";

export class RunCommandStep extends AzureWizardPromptStep<ILocalProjectWizardContext> {
    public async prompt(wizardContext: ILocalProjectWizardContext): Promise<void> {
        const buildPreset: IBuildPreset = nonNullProp(wizardContext, 'buildPreset');
        wizardContext.runCommand = await wizardContext.ui.showInputBox({
            prompt: localize('enterRunCommand', `Enter the command that serves your {0} app relative to the app location. For example 'npm start'.`, buildPreset.displayName),
            value: buildPreset.startCommand
        });
    }

    public shouldPrompt(wizardContext: ILocalProjectWizardContext): boolean {
        return !!wizardContext.buildPreset;
    }
}
