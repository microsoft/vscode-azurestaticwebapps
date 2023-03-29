/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { ShellExecution, Task, workspace } from 'vscode';
import { SwaTaskProvider } from '../extension.bundle';
import { getWorkspaceUri } from './testUtils';

interface ITestCase {
    workspaceName: string;
    hasDabConfig?: boolean;
}

const testCases: ITestCase[] = [
    {
        workspaceName: 'react-basic-dab',
        hasDabConfig: true,
    },
    {
        workspaceName: 'react-basic',
        hasDabConfig: false,
    },
];

function verifyTaskForkWorkspace(testCase: ITestCase, task: Task) {
    const execution = task.execution as ShellExecution;
    if (testCase.hasDabConfig) {
        const message = `Expected --data-api-location argument to${testCase.hasDabConfig ? '' : ' NOT'} be present in task shell execution. Found args: ${execution.args.join(' ')}`;
        assert.strictEqual(execution.args.includes('--data-api-location'), testCase.hasDabConfig, message);
    }
}

suite.only('SWA task provider', async () => {
    const taskProvider = new SwaTaskProvider();


    for (const testCase of testCases) {
        test(testCase.workspaceName, async () => {
            const workspaceUri = getWorkspaceUri(testCase.workspaceName);
            const workspaceFolder = workspace.getWorkspaceFolder(workspaceUri);

            if (workspaceFolder) {
                const tasks = await taskProvider.provideTasksForWorkspaceFolder(workspaceFolder);

                tasks.forEach((task) => {
                    verifyTaskForkWorkspace(testCase, task);
                })
            }
        });
    }
});
