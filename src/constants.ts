/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

export const githubApiEndpoint: string = 'https://api.github.com';
export const localSettingsFileName: string = 'local.settings.json';
export const defaultApiName: string = 'api';
export const productionEnvironmentName: string = 'Production';

export const appSubpathSetting: string = 'appSubpath';
export const apiSubpathSetting: string = 'apiSubpath';
export const appArtifactSubpathSetting: string = 'appArtifactSubpath';

// Doc for these parameter values: https://developer.github.com/v3/checks/runs/#parameters
export type Conclusion = 'success' | 'failure' | 'skipped' | 'cancelled' | null;

export type Status = 'queued' | 'in_progress';
