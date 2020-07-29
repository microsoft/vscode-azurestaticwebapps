/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { IAzureQuickPickItem } from "vscode-azureextensionui";
import { localize } from "./utils/localize";

export const githubApiEndpoint: string = 'https://api.github.com';
export const localSettingsFileName: string = 'local.settings.json';

export const defaultAppLocation: string = '/';
export const defaultApiLocation: string = 'api';
export const productionEnvironmentName: string = 'Production';

export const appSubpathSetting: string = 'appSubpath';
export const apiSubpathSetting: string = 'apiSubpath';
export const appArtifactSubpathSetting: string = 'appArtifactSubpath';

// an empty string is the same as skipping for the SWA API
export const skipForNowQuickPickItem: IAzureQuickPickItem<string> = { label: localize('skipForNow', '$(clock) Skip for now'), data: '' };
export const enterInputQuickPickItem: IAzureQuickPickItem<string> = { label: localize('input', '$(keyboard) Manually enter location'), data: 'manuallyEnter' };
