/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert = require('assert');
import { Uri, workspace } from 'vscode';
import { runWithTestActionContext } from 'vscode-azureextensiondev';
import { AzExtFsExtra } from 'vscode-azureextensionui';
import { initProjectForVSCode } from '../extension.bundle';
import { isCI } from './global.test';
import { getWorkspaceUri } from './testUtils';

interface ITestCase {
    /**
     * If undefined, use the version as the folder name
     */
    workspaceFolder: string;
    expectedResult: {
        tasks: any;
        launch: any;
    };
}

suite('Init project for VS Code', function (this: Mocha.Suite) {
    this.timeout(5 * 1000);

    suiteSetup(function (this: Mocha.Context): void {
        if (isCI) {
            this.skip();
        }
    });

    const testCases: ITestCase[] = [
        {
            workspaceFolder: 'react-basic-api',
            expectedResult: {
                tasks: {
                    "version": "2.0.0",
                    "tasks": [
                        {
                            "type": "func",
                            "command": "host start",
                            "problemMatcher": "$func-node-watch",
                            "isBackground": true,
                            "dependsOn": "npm install (functions)",
                            "options": {
                                "cwd": "${workspaceFolder}/api"
                            }
                        },
                        {
                            "type": "shell",
                            "label": "npm install (functions)",
                            "command": "npm install",
                            "options": {
                                "cwd": "${workspaceFolder}/api"
                            }
                        },
                        {
                            "type": "shell",
                            "label": "npm prune (functions)",
                            "command": "npm prune --production",
                            "problemMatcher": [],
                            "options": {
                                "cwd": "${workspaceFolder}/api"
                            }
                        },
                        {
                            "type": "shell",
                            "label": "swa start app",
                            "command": "swa start app",
                            "dependsOn": [
                                "npm install (swa)"
                            ],
                            "isBackground": true,
                            "problemMatcher": "$swa-watch",
                            "options": {
                                "env": {
                                    "BROWSER": "none"
                                }
                            }
                        },
                        {
                            "type": "shell",
                            "label": "npm install (swa)",
                            "command": "npm install",
                            "options": {
                                "cwd": "${workspaceFolder}/"
                            }
                        }
                    ]
                },
                launch: {
                    "version": "0.2.0",
                    "configurations": [
                        {
                            "name": "Run frontend",
                            "request": "launch",
                            "type": "pwa-chrome",
                            "url": "http://localhost:4280",
                            "preLaunchTask": "swa start app",
                            "presentation": {
                                "hidden": true
                            },
                            "webRoot": "${workspaceFolder}/"
                        },
                        {
                            "name": "Attach to Node Functions",
                            "type": "node",
                            "request": "attach",
                            "port": 9229,
                            "preLaunchTask": "func: host start"
                        }
                    ],
                    "compounds": [
                        {
                            "name": "SWA: Run and Debug",
                            "configurations": [
                                "Run frontend",
                                "Attach to Node Functions"
                            ],
                            "stopAll": true,
                            "presentation": {
                                "hidden": false,
                                "order": 1
                            }
                        }
                    ]
                }
            }
        }
    ]

    for (const t of testCases) {
        test(t.workspaceFolder, async function (this: Mocha.Context) {
            this.timeout(10 * 1000);
            await runWithTestActionContext('staticWebApp.initProjectForVSCode', async (context) => {
                await context.ui.runWithInputs(['react-basic-api'], async () => {
                    await initProjectForVSCode(context);
                });

                const tasksContents = JSON.parse(await AzExtFsExtra.readFile(Uri.joinPath(getWorkspaceUri(t.workspaceFolder), '.vscode', 'tasks.json')));
                const launchContents = JSON.parse(await AzExtFsExtra.readFile(Uri.joinPath(getWorkspaceUri(t.workspaceFolder), '.vscode', 'launch.json')));

                assert.deepStrictEqual(tasksContents, t.expectedResult.tasks);
                assert.deepStrictEqual(launchContents, t.expectedResult.launch);

                await workspace.fs.delete(Uri.joinPath(getWorkspaceUri(t.workspaceFolder), '.vscode'), { recursive: true, useTrash: false });
            });
        });
    }
});
