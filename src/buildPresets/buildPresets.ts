/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IBuildPreset } from "./IBuildPreset";

// hard-coded defaults for build presets until there is an API that supports this
export const buildPresets: IBuildPreset[] = [
    {
        id: 'angular',
        displayName: 'Angular',
        appLocation: '/',
        apiLocation: 'api',
        outputLocation: 'dist'
    },
    {
        id: 'react',
        displayName: 'React',
        appLocation: '/',
        apiLocation: 'api',
        outputLocation: 'build'
    },
    {
        id: 'svelte',
        displayName: 'Svelte',
        appLocation: '/',
        apiLocation: 'api',
        outputLocation: 'public'
    },
    {
        id: 'vuejs',
        displayName: 'Vue.js',
        appLocation: '/',
        apiLocation: 'api',
        outputLocation: 'dist'
    },
    {
        id: 'blazor',
        displayName: 'Blazor',
        appLocation: 'Client',
        apiLocation: 'Api',
        outputLocation: 'wwwroot'
    },

    {
        id: 'gatsby',
        displayName: 'Gatsby',
        appLocation: '/',
        apiLocation: 'api',
        outputLocation: 'public'
    },
    {
        id: 'hugo',
        displayName: 'Hugo',
        appLocation: '/',
        apiLocation: 'api',
        outputLocation: 'public'
    },
    {
        id: 'vuepress',
        displayName: 'VuePress',
        appLocation: '/',
        apiLocation: 'api',
        outputLocation: '.vuepress/dist'
    }
];
