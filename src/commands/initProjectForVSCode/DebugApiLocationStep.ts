/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ApiLocationStep } from "../createStaticWebApp/ApiLocationStep";
import { IStaticWebAppWizardContext } from "../createStaticWebApp/IStaticWebAppWizardContext";

export class DebugApiLocationStep extends ApiLocationStep {
    public shouldPrompt(context: IStaticWebAppWizardContext): boolean {
        if (!context.detectedApiLocations?.length) {
            context.apiLocation = '';
        } else if (context.detectedApiLocations?.length === 1) {
            context.apiLocation = context.detectedApiLocations[0];
        }

        return context.apiLocation === undefined;
    }
}
