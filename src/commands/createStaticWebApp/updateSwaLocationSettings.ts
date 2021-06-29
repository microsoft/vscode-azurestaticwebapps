/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { apiSubpathSetting, appSubpathSetting, defaultApiLocation, defaultAppLocation, outputSubpathSetting } from "../../constants";
import { updateWorkspaceSetting } from "../../utils/settingsUtils";
import { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";

export async function updateSwaLocationSettings(wizardContext: IStaticWebAppWizardContext): Promise<void> {
    if (wizardContext.fsPath) {
        if (wizardContext.appLocation !== wizardContext.buildPreset?.appLocation ?? defaultAppLocation) {
            await updateWorkspaceSetting(appSubpathSetting, wizardContext.appLocation, wizardContext.fsPath);
        }

        if (wizardContext.apiLocation !== wizardContext.buildPreset?.apiLocation ?? defaultApiLocation) {
            await updateWorkspaceSetting(apiSubpathSetting, wizardContext.apiLocation, wizardContext.fsPath);
        }

        if (wizardContext.outputLocation !== wizardContext.buildPreset?.outputLocation)
            await updateWorkspaceSetting(outputSubpathSetting, wizardContext.outputLocation, wizardContext.fsPath);
    }
}
