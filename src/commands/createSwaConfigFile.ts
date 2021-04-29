/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { writeFile } from 'fs-extra';
import { join } from 'path';
import { MessageItem, QuickPickItem, Uri, window, workspace } from 'vscode';
import { ext } from 'vscode-azureappservice/out/src/extensionVariables';
import { configFileName } from '../constants';
import { localize } from '../utils/localize';
import { selectWorkspaceFolder } from '../utils/workspaceUtils';

export async function createSwaConfigFile(): Promise<void> {
    const configFiles: Uri[] = await workspace.findFiles(`**/${configFileName}`);

    const openFile: MessageItem = { title: localize('openFile', 'Open File') };
    const createNew: MessageItem = { title: localize('createNew', 'Create New') };
    const chooseFileToOverwrite: MessageItem = { title: localize('chooseFileToOverwrite', 'Choose File to Overwrite') };
    const overwrite: MessageItem = { title: localize('overwrite', 'Overwrite') };

    let response: MessageItem | undefined;
    let configFilePath: string | undefined;

    if (configFiles.length > 1) {
        const multipleConfigFilesExist: string = localize('multipleConfigFilesExist', 'Multiple Static Web App configuration files already exist.');
        response = await ext.ui.showWarningMessage(multipleConfigFilesExist, { modal: true }, createNew, chooseFileToOverwrite);
    } else if (configFiles.length === 1) {
        configFilePath = configFiles[0].fsPath;
        const configFileExists: string = localize('configFileExists', 'Static Web App configuration file "{0}" already exists.', configFilePath);
        response = await ext.ui.showWarningMessage(configFileExists, { modal: true }, openFile, createNew, overwrite);
    }

    if (response === chooseFileToOverwrite) {
        const configFilePaths: QuickPickItem[] = configFiles.map(uri => { return { label: uri.fsPath } });
        configFilePath = (await ext.ui.showQuickPick(configFilePaths, { canPickMany: false })).label;
    } else if (!configFilePath || response === createNew) {
        configFilePath = await promptForConfigFilePath();
    }

    if (response !== openFile) {
        // The only case where we don't overwrite is `openFile`
        await writeFile(configFilePath, exampleConfigFile);
    }

    await window.showTextDocument(Uri.file(configFilePath));
}

async function promptForConfigFilePath(): Promise<string> {
    const workspaceFolder: string = await selectWorkspaceFolder(localize('selectConfigFileLocation', 'Select location to create "{0}"', configFileName));
    return join(workspaceFolder, configFileName);
}

// Source: https://json.schemastore.org/staticwebapp.config.json
const exampleConfigFile: string = `{
    "routes": [
        {
            "route": "/example",
            "rewrite": "/example.html"
        }
    ],
    "navigationFallback": {
        "rewrite": "/index.html"
    }
}`;
