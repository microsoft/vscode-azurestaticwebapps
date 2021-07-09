/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import * as vscode from 'vscode';
import { TestOutputChannel } from 'vscode-azureextensiondev';
import { ext, IActionContext } from '../extension.bundle';

export let longRunningTestsEnabled: boolean;

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

    ext.outputChannel = new TestOutputChannel();
    longRunningTestsEnabled = !/^(false|0)?$/i.test(process.env.ENABLE_LONG_RUNNING_TESTS || '');
});
