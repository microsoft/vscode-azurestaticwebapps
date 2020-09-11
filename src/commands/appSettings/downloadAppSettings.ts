/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as appservice from 'vscode-azureappservice';
import { IActionContext } from 'vscode-azureextensionui';
import { localSettingsFileName } from '../../constants';
import { ext } from '../../extensionVariables';
import { getLocalSettingsFile } from './getLocalSettingsFile';

export async function downloadAppSettings(context: IActionContext, node?: appservice.AppSettingsTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<appservice.AppSettingsTreeItem>(appservice.AppSettingsTreeItem.contextValue, { ...context, suppressCreatePick: true });
    }

    const localSettingsPath: string = await getLocalSettingsFile();
    await appservice.downloadAppSettings(node, localSettingsFileName, localSettingsPath);
}
