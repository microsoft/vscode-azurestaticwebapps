/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra, IActionContext } from '@microsoft/vscode-azext-utils';
import { MessageItem, window } from 'vscode';
import { URI, Utils } from 'vscode-uri';
import { configFileName } from '../constants';
import { localize } from '../utils/localize';
import { selectWorkspaceFolder } from '../utils/workspaceUtils';

export async function createSwaConfigFile(context: IActionContext): Promise<void> {
    const destPath: URI = await selectWorkspaceFolder(context, localize('selectConfigFileLocation', 'Select location to create "{0}"', configFileName));
    const configFilePath: URI = Utils.joinPath(destPath, configFileName);

    if (await AzExtFsExtra.pathExists(configFilePath)) {
        const configFileExists: string = localize('configFileExists', 'Static Web App configuration file "{0}" already exists.', configFilePath.fsPath);
        const overwrite: MessageItem = { title: localize('overwrite', 'Overwrite') };
        await context.ui.showWarningMessage(configFileExists, { modal: true }, overwrite);
    }

    await AzExtFsExtra.writeFile(configFilePath, exampleConfigFile);
    await window.showTextDocument(configFilePath);
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
