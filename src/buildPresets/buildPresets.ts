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
        displayName: 'Next.js (SSR)',
        appLocation: '/',
        apiLocation: '',
        outputLocation: '',
        port: 3000,
        group: 'framework'
    },
    {
        id: 'nextjs-export',
        displayName: 'Next.js (static export)',
        appLocation: '/',
        apiLocation: '',
        outputLocation: 'out',
        port: 3000,
        group: 'framework'
    },
    {
        id: 'nuxt3',
        displayName: 'Nuxt 3',
        appLocation: '/',
        apiLocation: '.output/server',
        outputLocation: '.output/public',
        port: 3000,
        group: 'framework'
    },
    {
        id: 'svelte-kit',
        displayName: 'SvelteKit',
        appLocation: '/',
        apiLocation: 'build/server',
        outputLocation: 'build/static',
        port: 3000,
        group: 'framework'
    },
    {
        id: 'html',
        displayName: 'HTML',
        appLocation: '/',
        apiLocation: '',
        outputLocation: '/',
        port: 3000, // port not currently used for HTML preset
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
    }
];
