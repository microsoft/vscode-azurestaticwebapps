/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TestOutputChannel, TestUserInput } from '@microsoft/vscode-azext-dev';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { ext, registerOnActionStartHandler } from '../extension.bundle';

const longRunningLocalTestsEnabled: boolean = !/^(false|0)?$/i.test(process.env.AzCode_EnableLongRunningTestsLocal || '');
const longRunningRemoteTestsEnabled: boolean = !/^(false|0)?$/i.test(process.env.AzCode_UseAzureFederatedCredentials || '');

export const isCI: boolean = /^True$/i.test(process.env.TF_BUILD || '');
export const longRunningTestsEnabled: boolean = longRunningLocalTestsEnabled || longRunningRemoteTestsEnabled;

// Runs before all tests
suiteSetup(async function (this: Mocha.Context): Promise<void> {
    this.timeout(1 * 60 * 1000);

    const extension = vscode.extensions.getExtension('ms-azuretools.vscode-azurestaticwebapps');
    if (!extension) {
        assert.fail('Failed to find extension.');
    } else {
        await extension.activate();
    }


    registerOnActionStartHandler(context => {
        // Use `TestUserInput` by default so we get an error if an unexpected call to `context.ui` occurs, rather than timing out
        context.ui = new TestUserInput(vscode);
    });

    ext.outputChannel = new TestOutputChannel();
});
