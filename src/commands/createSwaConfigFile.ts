/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { pathExists, writeFile } from 'fs-extra';
import { join } from 'path';
import { MessageItem, Uri, window } from 'vscode';
import { IActionContext } from 'vscode-azureextensionui';
import { configFileName } from '../constants';
import { localize } from '../utils/localize';
import { selectWorkspaceFolder } from '../utils/workspaceUtils';

export async function createSwaConfigFile(context: IActionContext): Promise<void> {
    const destPath: string = await selectWorkspaceFolder(context, localize('selectConfigFileLocation', 'Select location to create "{0}"', configFileName));
    const configFilePath: string = join(destPath, configFileName);

    if (await pathExists(configFilePath)) {
        const configFileExists: string = localize('configFileExists', 'Static Web App configuration file "{0}" already exists.', configFilePath);
        const overwrite: MessageItem = { title: localize('overwrite', 'Overwrite') };
        await context.ui.showWarningMessage(configFileExists, { modal: true }, overwrite);
    }

    await writeFile(configFilePath, exampleConfigFile);
    await window.showTextDocument(Uri.file(configFilePath));
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
