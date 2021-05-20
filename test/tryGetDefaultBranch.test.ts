/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert = require('assert');
import { Uri } from 'vscode';
import { cpUtils, getGitWorkspaceState, GitWorkspaceState, tryGetDefaultBranch } from '../extension.bundle';
import { cleanTestWorkspace, createTestActionContext, testFolderPath } from './global.test';

suite('Get default branch for Git repo', function (this: Mocha.Suite): void {
    this.timeout(30 * 1000);
    let gitWorkspaceState: GitWorkspaceState;
    const localDefaultBranch: string = 'localDefault';
    const globalDefaultBranch: string = 'globalDefault';

    suiteSetup(async () => {
        await cleanTestWorkspace();
        const context = createTestActionContext();
        const testFolderUri: Uri = Uri.file(testFolderPath);
        gitWorkspaceState = await getGitWorkspaceState(context, testFolderUri);

        await cpUtils.executeCommand(undefined, undefined, 'git', 'config', '--local', 'init.defaultBranch', localDefaultBranch);
        await cpUtils.executeCommand(undefined, undefined, 'git', 'config', '--global', 'init.defaultBranch', globalDefaultBranch);
    });

    test('Workspace with default branch set in local config', async () => {
        if (!gitWorkspaceState.repo) {
            throw new Error('Could not retrieve git repository.');
        }

        assert.strictEqual(await tryGetDefaultBranch(gitWorkspaceState.repo), localDefaultBranch);
    });

    test('Workspace with default branch set in global config', async () => {
        if (!gitWorkspaceState.repo) {
            throw new Error('Could not retrieve git repository.');
        }

        assert.strictEqual(await tryGetDefaultBranch(gitWorkspaceState.repo), globalDefaultBranch);
    });

    suiteTeardown(async () => {
        // reset the configs
        await cpUtils.executeCommand(undefined, undefined, 'git', 'config', '--local', 'init.defaultBranch', '');
        await cpUtils.executeCommand(undefined, undefined, 'git', 'config', '--global', 'init.defaultBranch', '');
    })
});
