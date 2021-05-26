/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import * as fse from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { TestOutputChannel, TestUserInput } from 'vscode-azureextensiondev';
import { cpUtils, ext, IActionContext } from '../extension.bundle';
import { getRandomHexString } from './getRandomHexString';

export let longRunningTestsEnabled: boolean;
export const testUserInput: TestUserInput = new TestUserInput(vscode);

/**
 * Folder for most tests that do not need a workspace open
 */
export const testFolderPath: string = path.join(os.tmpdir(), `azSwaTest${getRandomHexString()}`);
/**
 * Folder for tests that require a workspace
 */
export let testWorkspacePath: string;

export function createTestActionContext(): IActionContext {
    return { telemetry: { properties: {}, measurements: {} }, errorHandling: { issueProperties: {} }, ui: testUserInput, valuesToMask: [] };
}

// Runs before all tests
suiteSetup(async function (this: Mocha.Context): Promise<void> {
    this.timeout(1 * 60 * 1000);

    const extension = vscode.extensions.getExtension('ms-azuretools.vscode-azurestaticwebapps');
    if (!extension) {
        assert.fail('Failed to find extension.');
    } else {
        await extension.activate();
    }

    await fse.ensureDir(testFolderPath);
    await fse.emptyDir(testFolderPath);
    testWorkspacePath = await initTestWorkspacePath();

    ext.outputChannel = new TestOutputChannel();
    ext.ui = testUserInput;

    longRunningTestsEnabled = !/^(false|0)?$/i.test(process.env.ENABLE_LONG_RUNNING_TESTS || '');

    // set the user name and email since this seems to be required for everything
    await cpUtils.executeCommand(undefined, undefined, 'git', 'config', '--global', 'user.name', 'Automated Tester');
    await cpUtils.executeCommand(undefined, undefined, 'git', 'config', '--global', 'user.email', 'automated@testing.com');
});

export async function cleanTestWorkspace(): Promise<void> {
    await fse.emptyDir(testWorkspacePath);
}

async function initTestWorkspacePath(): Promise<string> {
    const workspaceFolders: readonly vscode.WorkspaceFolder[] | undefined = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        throw new Error("No workspace is open");
    } else {
        assert.strictEqual(workspaceFolders.length, 1, "Expected only one workspace to be open.");
        const workspacePath: string = workspaceFolders[0].uri.fsPath;
        assert.strictEqual(path.basename(workspacePath), 'testWorkspace', "Opened against an unexpected workspace.");
        await fse.ensureDir(workspacePath);
        await fse.emptyDir(workspacePath);
        return workspacePath;
    }
}
