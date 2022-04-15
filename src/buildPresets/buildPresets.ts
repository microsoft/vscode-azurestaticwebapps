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
        port: 4200,
        group: 'framework'
    },
    {
        id: 'react',
        displayName: 'React',
        appLocation: '/',
        apiLocation: 'api',
        outputLocation: 'build',
        port: 3000,
        startCommand: 'npm start',
        group: 'framework'

    },
    {
        id: 'svelte',
        displayName: 'Svelte',
        appLocation: '/',
        apiLocation: 'api',
        outputLocation: 'public',
        port: 5000,
        group: 'framework'

    },
    {
        id: 'vuejs',
        displayName: 'Vue.js',
        appLocation: '/',
        apiLocation: 'api',
        outputLocation: 'dist',
        port: 8080,
        startCommand: 'npm run serve',
        group: 'framework'

    },
    {
        id: 'blazor',
        displayName: 'Blazor',
        appLocation: 'Client',
        apiLocation: 'Api',
        outputLocation: 'wwwroot',
        port: 5000,
        group: 'framework'

    },
    {
        id: 'nextjs',
        displayName: 'Next.JS (SSR)',
        appLocation: '/',
        apiLocation: '',
        outputLocation: '',
        port: 3000,
        group: 'framework'
    },

    {
        id: 'gatsby',
        displayName: 'Gatsby',
        appLocation: '/',
        apiLocation: 'api',
        outputLocation: 'public',
        port: 8000,
        group: 'ssg'
    },
    {
        id: 'hugo',
        displayName: 'Hugo',
        appLocation: '/',
        apiLocation: 'api',
        outputLocation: 'public',
        port: 1313,
        group: 'ssg'
    },
    {
        id: 'vuepress',
        displayName: 'VuePress',
        appLocation: '/',
        apiLocation: 'api',
        outputLocation: '.vuepress/dist',
        port: 8080,
        group: 'ssg'
    },
    {
        id: 'nextjs',
        displayName: 'Next.JS (static export)',
        appLocation: '/',
        apiLocation: '',
        outputLocation: 'out',
        port: 3000,
        group: 'ssg'
    }
];
