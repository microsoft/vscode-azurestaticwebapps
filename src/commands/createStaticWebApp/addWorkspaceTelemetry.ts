/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as git from 'simple-git/promise';
import { workspace } from 'vscode';
import { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";

export function addWorkspaceTelemetry(wizardContext: IStaticWebAppWizardContext): void {
    wizardContext.telemetry.properties.isGitInstalled = 'true';
    const localGit: git.SimpleGit = git(wizardContext.fsPath);

    // tslint:disable-next-line:no-floating-promises
    localGit.status().then(() => {
        wizardContext.telemetry.properties.isGitProject = 'true';
    }).catch((error) => {
        // tslint:disable: no-unsafe-any
        if (error.message.indexOf('spawn git ENOENT') >= 0) {
            wizardContext.telemetry.properties.isGitInstalled = 'false';
        } else if (error.message.indexOf('fatal: Not a git repository') >= 0) {
            wizardContext.telemetry.properties.isGitProject = 'false';
        }
    }).finally(() => {
        wizardContext.telemetry.properties.numberOfWorkspaces = !workspace.workspaceFolders ? String(0) : String(workspace.workspaceFolders.length);
        wizardContext.telemetry.properties.gotRemote = String(!!wizardContext.repoHtmlUrl);
    });
}
