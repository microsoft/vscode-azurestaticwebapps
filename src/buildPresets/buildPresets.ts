/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { angularOutputLocation } from "../constants";
import { IBuildPreset } from "./IBuildPreset";

// hard-coded defaults for build presets until there is an API that supports this
export const buildPresets: IBuildPreset[] = [
    {
        id: 'angular',
        displayName: 'Angular',
        appLocation: '/',
        apiLocation: 'api',
        outputLocation: angularOutputLocation,
        port: 4200
    },
    {
        id: 'react',
        displayName: 'React',
        appLocation: '/',
        apiLocation: 'api',
        outputLocation: 'build',
        port: 3000,
        startCommand: 'npm start'
    },
    {
        id: 'svelte',
        displayName: 'Svelte',
        appLocation: '/',
        apiLocation: 'api',
        outputLocation: 'public',
        port: 5000
    },
    {
        id: 'vuejs',
        displayName: 'Vue.js',
        appLocation: '/',
        apiLocation: 'api',
        outputLocation: 'dist',
        port: 8080,
        startCommand: 'npm run serve'
    },
    {
        id: 'blazor',
        displayName: 'Blazor',
        appLocation: 'Client',
        apiLocation: 'Api',
        outputLocation: 'wwwroot',
        port: 5000
    },

    {
        id: 'gatsby',
        displayName: 'Gatsby',
        appLocation: '/',
        apiLocation: 'api',
        outputLocation: 'public',
        port: 8000
    },
    {
        id: 'hugo',
        displayName: 'Hugo',
        appLocation: '/',
        apiLocation: 'api',
        outputLocation: 'public',
        port: 1313
    },
    {
        id: 'vuepress',
        displayName: 'VuePress',
        appLocation: '/',
        apiLocation: 'api',
        outputLocation: '.vuepress/dist',
        port: 8080
    }
];
