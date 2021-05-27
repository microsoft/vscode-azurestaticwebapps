/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert = require('assert');
import { Uri } from 'vscode';
import { cpUtils, getGitWorkspaceState, GitWorkspaceState, tryGetDefaultBranch } from '../extension.bundle';
import { createTestActionContext, testFolderPath } from './global.test';

suite('Get default branch for Git repo', function (this: Mocha.Suite): void {
    this.timeout(30 * 1000);
    const context = createTestActionContext();
    const testFolderUri: Uri = Uri.file(testFolderPath);
    const localDefaultBranch: string = 'localDefault';
    const globalDefaultBranch: string = 'globalDefault';

    test('Workspace with default branch set in global config', async () => {
        await cpUtils.executeCommand(undefined, undefined, 'git', 'config', '--global', 'init.defaultBranch', globalDefaultBranch);
        const gitWorkspaceState: GitWorkspaceState = await getGitWorkspaceState(context, testFolderUri);

        if (!gitWorkspaceState.repo) {
            throw new Error('Could not retrieve git repository.');
        }

        await gitWorkspaceState.repo.createBranch(globalDefaultBranch, false);
        assert.strictEqual(await tryGetDefaultBranch(gitWorkspaceState.repo), globalDefaultBranch);
    });

    test('Workspace with default branch set in local config', async () => {
        await cpUtils.executeCommand(undefined, testFolderPath, 'git', 'config', '--local', 'init.defaultBranch', localDefaultBranch);
        const gitWorkspaceState: GitWorkspaceState = await getGitWorkspaceState(context, testFolderUri);

        if (!gitWorkspaceState.repo) {
            throw new Error('Could not retrieve git repository.');
        }

        await gitWorkspaceState.repo.createBranch(localDefaultBranch, false);
        assert.strictEqual(await tryGetDefaultBranch(gitWorkspaceState.repo), localDefaultBranch);
    });

    suiteTeardown(async () => {
        // reset the configs
        await cpUtils.executeCommand(undefined, testFolderPath, 'git', 'config', '--local', 'init.defaultBranch', '');
        await cpUtils.executeCommand(undefined, undefined, 'git', 'config', '--global', 'init.defaultBranch', '');
    })
});
