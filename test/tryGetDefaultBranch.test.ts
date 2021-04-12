/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert = require('assert');
import { Uri } from 'vscode';
import { getGitWorkspaceState, GitWorkspaceState, tryGetDefaultBranch } from '../extension.bundle';
import { cleanTestWorkspace, createTestActionContext, testFolderPath } from './global.test';

suite('Get default branch for Git repo', function (this: Mocha.Suite): void {
    this.timeout(30 * 1000);
    let gitWorkspaceState: GitWorkspaceState;
    const mainBranch: string = 'main';
    suiteSetup(async () => {
        await cleanTestWorkspace();
        const context = createTestActionContext();
        const testFolderUri: Uri = Uri.file(testFolderPath);
        gitWorkspaceState = await getGitWorkspaceState(context, testFolderUri);

        await gitWorkspaceState.repo?.setConfig('init.defaultBranch', mainBranch);
        // set global config here
    });

    test('Workspace with default branch set in local config', async () => {
        if (!gitWorkspaceState.repo) {
            throw new Error('Could not retrieve git repository.');
        }

        assert.strictEqual(await tryGetDefaultBranch(gitWorkspaceState.repo), mainBranch);
    });

    test('Workspace with default branch set in global config', async () => {
        // todo Git API doesn't have a setGlobalConfig so will look for an alternative method
    });

    suiteTeardown(async () => {
        // reset the configs
        await gitWorkspaceState.repo?.setConfig('init.defaultBranch', '');
    })
});
