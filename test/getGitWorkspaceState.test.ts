/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import * as fse from 'fs-extra';
import * as path from 'path';
import { Uri } from "vscode";
import { DialogResponses } from 'vscode-azureextensionui';
import { getGitWorkspaceState, GitWorkspaceState, promptForDefaultBranch, verifyGitWorkspaceForCreation } from "../extension.bundle";
import { cleanTestWorkspace, createTestActionContext, testUserInput, testWorkspacePath } from "./global.test";

suite('Workspace Configurations for SWA Creation', function (this: Mocha.Suite): void {
    const testCommitMsg: string = 'Test commit';
    this.timeout(30 * 1000);

    suiteSetup(async () => {
        await cleanTestWorkspace();
    });

    test('Empty workspace with no git repository', async () => {
        await testUserInput.runWithInputs([DialogResponses.yes.title, testCommitMsg], async () => {
            const context = createTestActionContext();
            const testWorkspaceUri: Uri = Uri.file(testWorkspacePath);
            const gitWorkspaceState: GitWorkspaceState = await getGitWorkspaceState(context, testWorkspaceUri);
            assert.strictEqual(gitWorkspaceState.repo, null, 'Workspace contained a repository prior to test');

            await verifyGitWorkspaceForCreation(context, gitWorkspaceState, testWorkspaceUri);
            assert.ok(gitWorkspaceState.repo, 'Repo did not successfully initialize')
        });

    });

    test('Workspace with dirty workspace tree', async () => {
        await testUserInput.runWithInputs(['Commit', testCommitMsg], async () => {
            const context = createTestActionContext();
            const testWorkspaceUri: Uri = Uri.file(testWorkspacePath);

            const testTextFilePath: string = path.join(testWorkspacePath, 'test.txt');
            await fse.ensureFile(testTextFilePath);
            await fse.writeFile(testTextFilePath, 'Test');

            const gitWorkspaceState: GitWorkspaceState = await getGitWorkspaceState(context, testWorkspaceUri);
            assert.strictEqual(gitWorkspaceState.dirty, true, 'Workspace tree was not dirty');

            await verifyGitWorkspaceForCreation(context, gitWorkspaceState, testWorkspaceUri);
            assert.ok(gitWorkspaceState.repo, 'Repo did not successfully initialize')
        });
    });

    test('Workspace on default branch', async () => {
        await testUserInput.runWithInputs([], async () => {
            const context = createTestActionContext();
            const testWorkspaceUri: Uri = Uri.file(testWorkspacePath);

            const gitWorkspaceState: GitWorkspaceState = await getGitWorkspaceState(context, testWorkspaceUri);
            if (!gitWorkspaceState.repo) {
                throw new Error('Could not retrieve git repository.');
            }

            // shouldn't prompt
            await promptForDefaultBranch(context, gitWorkspaceState.repo);
        });
    });

    test('Workspace not on default branch', async () => {
        await testUserInput.runWithInputs(['Checkout "master"'], async () => {
            const context = createTestActionContext();
            const testWorkspaceUri: Uri = Uri.file(testWorkspacePath);

            const gitWorkspaceState: GitWorkspaceState = await getGitWorkspaceState(context, testWorkspaceUri);
            if (!gitWorkspaceState.repo) {
                throw new Error('Could not retrieve git repository.');
            }

            await gitWorkspaceState.repo.createBranch('test', true);
            await promptForDefaultBranch(context, gitWorkspaceState.repo);
        });
    });
});
