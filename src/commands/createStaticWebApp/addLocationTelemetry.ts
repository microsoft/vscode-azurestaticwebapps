/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { enterInputQuickPickItem, skipForNowQuickPickItem } from "../../constants";
import { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";

export function addLocationTelemetry(wizardContext: IStaticWebAppWizardContext, key: 'appLocation' | 'apiLocation' | 'appArtifactLocation', defaultValue: string): void {
    const value: string | undefined = wizardContext[key];
    let telemValue: string;
    if (!value) {
        telemValue = 'empty';
    } else if (value === defaultValue) {
        telemValue = 'default';
    } else if (value === enterInputQuickPickItem.data) {
        telemValue = 'manuallyEnter';
    } else if (value === skipForNowQuickPickItem.data) {
        telemValue = 'skip';
    } else {
        telemValue = 'nonDefault';
    }

    wizardContext.telemetry.properties[key] = telemValue;
}
