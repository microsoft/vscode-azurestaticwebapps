/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { writeFile } from 'fs-extra';
import { join } from 'path';
import { EntryInfo, promise } from 'readdirp';
import { TextDocument, Uri, window, workspace } from 'vscode';
import { ext } from 'vscode-azureappservice/out/src/extensionVariables';
import { IActionContext } from 'vscode-azureextensionui';
import { configFileName } from '../constants';
import { localize } from '../utils/localize';
import { getWorkspaceFolder } from '../utils/workspaceUtils';

export async function createSwaConfigFile(context: IActionContext): Promise<void> {
    const workspacePath: string = (await getWorkspaceFolder(context)).uri.fsPath;
    let configFilePath: string | undefined = await getExistingConfigFilePath(workspacePath);

    if (configFilePath) {
        void ext.ui.showWarningMessage(localize('swaConfigFileExists', 'Static Web App configuration file "{0}" already exists.', configFilePath));
    } else {
        configFilePath = join(workspacePath, configFileName);
        await writeFile(configFilePath, exampleConfigFile);
    }

    const textDocument: TextDocument = await workspace.openTextDocument(Uri.file(configFilePath));
    await window.showTextDocument(textDocument);
}

async function getExistingConfigFilePath(workspacePath: string): Promise<string | undefined> {
    const entries: EntryInfo[] = await promise(workspacePath, { fileFilter: configFileName });
    return entries.length && entries[0].fullPath || undefined;
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
