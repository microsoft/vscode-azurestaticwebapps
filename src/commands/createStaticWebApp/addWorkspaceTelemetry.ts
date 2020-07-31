/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as git from 'simple-git/promise';
import { workspace } from 'vscode';
import { IParsedError, parseError } from 'vscode-azureextensionui';
import { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";

export function addWorkspaceTelemetry(wizardContext: IStaticWebAppWizardContext): void {
    wizardContext.telemetry.properties.isGitInstalled = 'true';
    wizardContext.telemetry.properties.numberOfWorkspaces = !workspace.workspaceFolders ? String(0) : String(workspace.workspaceFolders.length);
    wizardContext.telemetry.properties.gotRemote = String(!!wizardContext.repoHtmlUrl);

    const localGit: git.SimpleGit = git(wizardContext.fsPath);
    // tslint:disable-next-line:no-floating-promises
    localGit.status().then(() => {
        wizardContext.telemetry.properties.isGitProject = 'true';
    }).catch((error) => {
        const pError: IParsedError = parseError(error);
        if (pError.message.includes('spawn git ENOENT')) {
            wizardContext.telemetry.properties.isGitInstalled = 'false';
        } else if (pError.message.includes('fatal: Not a git repository')) {
            wizardContext.telemetry.properties.isGitProject = 'false';
        }
    });
}
