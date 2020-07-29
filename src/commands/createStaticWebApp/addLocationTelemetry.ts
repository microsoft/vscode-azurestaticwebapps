/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";

export function addLocationTelemetry(wizardContext: IStaticWebAppWizardContext, key: 'appLocation' | 'apiLocation' | 'appArtifactLocation', defaultValue: string): void {
    const value: string | undefined = wizardContext[key];
    let telemValue: string;
    if (value === undefined) {
        telemValue = 'manuallyEnter';
    } else if (value.length === 0) {
        telemValue = 'empty';
    } else if (value === defaultValue) {
        telemValue = 'default';
    } else {
        telemValue = 'nonDefault';
    }

    wizardContext.telemetry.properties[key] = telemValue;
}
