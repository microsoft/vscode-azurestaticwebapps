/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";

export function addLocationTelemetry(context: IStaticWebAppWizardContext, key: 'appLocation' | 'apiLocation' | 'outputLocation', defaultValue: string, valueFromSetting?: string): void {
    const value: string | undefined = context[key];
    context.telemetry.properties[`${key}HasSetting`] = (!!valueFromSetting).toString();
    context.telemetry.properties[`${key}MatchesSetting`] = (defaultValue === valueFromSetting).toString();

    let telemValue: string;
    if (value === undefined) {
        // no telemetry to add yet
        return;
    } else if (value.length === 0) {
        telemValue = 'empty';
    } else if (value === defaultValue) {
        telemValue = 'default';
    } else if (value === valueFromSetting) {
        telemValue = 'setting';
    } else {
        telemValue = 'nonDefault';
    }

    context.telemetry.properties[key] = telemValue;
}
