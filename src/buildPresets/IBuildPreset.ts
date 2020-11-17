/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Describes the build presets used for the app/api/app artifact locations
 */

export interface IBuildPreset {
    id: string;
    displayName: string;
    appLocation: string;
    apiLocation: string;
    outputLocation: string;
}
