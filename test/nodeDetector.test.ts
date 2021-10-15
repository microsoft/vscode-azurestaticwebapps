/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { Uri } from "vscode";
import { DetectorResults, NodeConstants, NodeDetector } from '../extension.bundle';
import { getWorkspaceUri } from './testUtils';

interface ITestCase {
    /**
     * If undefined, use the version as the folder name
     */
    workspaceFolder: string;
    expectedResult: DetectorResults | undefined
}

suite('Node detector', () => {
    const testCases: ITestCase[] = [
        {
            workspaceFolder: 'angular-basic',
            expectedResult: {
                platform: "nodejs",
                platformVersion: undefined,
                appDirectory: "",
                frameworks: [
                    {
                        framework: NodeConstants.DevDependencyFrameworkKeyWordToName["@angular/cli"],
                        version: "~11.2.2",
                    },
                    {
                        framework: NodeConstants.DevDependencyFrameworkKeyWordToName["typescript"],
                        version: "~4.1.5",
                    },
                ],
                hasLernaJsonFile: false,
                hasLageConfigJSFile: false,
                lernaNpmClient: "",
                hasYarnrcYmlFile: false,
                isYarnLockFileValidYamlFormat: false,
            }
        },
        {
            workspaceFolder: 'nextjs-starter',
            expectedResult: {
                platform: "nodejs",
                platformVersion: undefined,
                appDirectory: "",
                frameworks: [
                    {
                        framework: NodeConstants.DependencyFrameworkKeyWordToName["next"],
                        version: "^10.0.7",
                    },
                    {
                        framework: NodeConstants.DependencyFrameworkKeyWordToName["react"],
                        version: "^17.0.2",
                    },
                ],
                hasLernaJsonFile: false,
                hasLageConfigJSFile: false,
                lernaNpmClient: "",
                hasYarnrcYmlFile: false,
                isYarnLockFileValidYamlFormat: false,
            }
        },
        {
            workspaceFolder: 'nuxtjs-starter',
            expectedResult: {
                platform: "nodejs",
                platformVersion: undefined,
                appDirectory: "",
                frameworks: [
                    {
                        framework: NodeConstants.DependencyFrameworkKeyWordToName["nuxt"],
                        version: "^2.15.7",
                    },
                ],
                hasLernaJsonFile: false,
                hasLageConfigJSFile: false,
                lernaNpmClient: "",
                hasYarnrcYmlFile: false,
                isYarnLockFileValidYamlFormat: false,
            }
        },
        {
            workspaceFolder: 'react-basic',
            expectedResult: {
                platform: "nodejs",
                platformVersion: undefined,
                appDirectory: "",
                frameworks: [
                    {
                        framework: NodeConstants.DependencyFrameworkKeyWordToName["react"],
                        version: "^16.12.0",
                    },
                ],
                hasLernaJsonFile: false,
                hasLageConfigJSFile: false,
                lernaNpmClient: "",
                hasYarnrcYmlFile: false,
                isYarnLockFileValidYamlFormat: false,
            }
        },
        {
            workspaceFolder: 'svelte-basic',
            expectedResult: {
                platform: "nodejs",
                platformVersion: undefined,
                appDirectory: "",
                frameworks: [
                    {
                        framework: NodeConstants.DevDependencyFrameworkKeyWordToName["svelte"],
                        version: "^3.0.0",
                    },
                ],
                hasLernaJsonFile: false,
                hasLageConfigJSFile: false,
                lernaNpmClient: "",
                hasYarnrcYmlFile: false,
                isYarnLockFileValidYamlFormat: false,
            }
        },
        {
            workspaceFolder: 'vanilla-basic',
            expectedResult: undefined
        },
        {
            workspaceFolder: 'vue-basic',
            expectedResult: {
                platform: "nodejs",
                platformVersion: undefined,
                appDirectory: "",
                frameworks: [
                    {
                        framework: NodeConstants.DevDependencyFrameworkKeyWordToName["@vue/cli-service"],
                        version: "~4.2.0",
                    },
                    {
                        framework: NodeConstants.DependencyFrameworkKeyWordToName["vue"],
                        version: "^2.6.11",
                    },
                ],
                hasLernaJsonFile: false,
                hasLageConfigJSFile: false,
                lernaNpmClient: "",
                hasYarnrcYmlFile: false,
                isYarnLockFileValidYamlFormat: false,
            }
        }
    ]

    for (const t of testCases) {
        test(t.workspaceFolder, async () => {
            await testNodeDetector(t);
        });
    }
});

async function testNodeDetector(testCase: ITestCase): Promise<void> {
    const workspaceUri: Uri = getWorkspaceUri(testCase.workspaceFolder);
    const result = await new NodeDetector().detect(workspaceUri);
    assert.deepStrictEqual(result, testCase.expectedResult);
}
