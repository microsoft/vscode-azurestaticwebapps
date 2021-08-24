/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IBuildPreset } from "./IBuildPreset";

// hard-coded defaults for build presets until there is an API that supports this
const internalBuildPresets = {
    angular: {
        displayName: 'Angular',
        appLocation: '/',
        apiLocation: 'api',
        outputLocation: 'dist'
    },
    react: {
        displayName: 'React',
        appLocation: '/',
        apiLocation: 'api',
        outputLocation: 'build'
    },
    svelte: {
        displayName: 'Svelte',
        appLocation: '/',
        apiLocation: 'api',
        outputLocation: 'public'
    },
    vuejs: {
        displayName: 'Vue.js',
        appLocation: '/',
        apiLocation: 'api',
        outputLocation: 'dist'
    },
    blazor: {
        displayName: 'Blazor',
        appLocation: 'Client',
        apiLocation: 'Api',
        outputLocation: 'wwwroot'
    },

    gatsby: {
        displayName: 'Gatsby',
        appLocation: '/',
        apiLocation: 'api',
        outputLocation: 'public'
    },
    hugo: {
        displayName: 'Hugo',
        appLocation: '/',
        apiLocation: 'api',
        outputLocation: 'public'
    },
    vuepress: {
        displayName: 'VuePress',
        appLocation: '/',
        apiLocation: 'api',
        outputLocation: '.vuepress/dist'
    }
} as const;

type BuildPresets = keyof typeof internalBuildPresets;
export const buildPresets: Record<BuildPresets, IBuildPreset> = internalBuildPresets;
