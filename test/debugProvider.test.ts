/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { DebugConfiguration, workspace } from 'vscode';
import { StaticWebAppDebugProvider } from '../extension.bundle';
import { getWorkspaceUri } from './testUtils';

interface ITestCase {
    workspaceName: string;
    configs: DebugConfiguration[];
}

const testCases: ITestCase[] = [
    {
        workspaceName: 'react-basic',
        configs: [
            {
                "name": "SWA: Run react-basic",
                "request": "launch",
                "timeout": 30000,
                "type": "pwa-chrome",
                "url": "http://localhost:4280",
                "preLaunchTask": "swa: start react-basic",
                "webRoot": "${workspaceFolder}/"
            }
        ]
    },
    {
        workspaceName: 'angular-basic',
        configs: [
            {
                "name": "SWA: Run angular-basic",
                "request": "launch",
                "timeout": 30000,
                "type": "pwa-chrome",
                "url": "http://localhost:4280",
                "preLaunchTask": "swa: start angular-basic",
                "webRoot": "${workspaceFolder}/"
            }
        ]
    },
    {
        workspaceName: 'vanilla-basic',
        configs: [
            {
                "name": "SWA: Run app (swa-cli.config.json)",
                "request": "launch",
                "timeout": 30000,
                "type": "pwa-chrome",
                "url": "http://localhost:4280",
                "preLaunchTask": "swa: start app",
                "webRoot": "${workspaceFolder}/"
            }
        ]
    }
];

suite('Debug provider', async () => {
    const debugProvider = new StaticWebAppDebugProvider();

    for (const testCase of testCases) {
        test(testCase.workspaceName, async () => {
            const workspaceUri = getWorkspaceUri(testCase.workspaceName);
            const workspaceFolder = workspace.getWorkspaceFolder(workspaceUri);

            if (workspaceFolder) {
                const configs = await debugProvider.provideDebugConfigurations(workspaceFolder);
                assert.deepStrictEqual(configs, testCase.configs);
            }
        });
    }
});
