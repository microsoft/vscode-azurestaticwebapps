/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AppSettingTreeItem } from 'vscode-azureappservice';
import { IActionContext } from 'vscode-azureextensionui';
import { ext } from '../../extensionVariables';

export async function editAppSetting(context: IActionContext, node?: AppSettingTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<AppSettingTreeItem>(AppSettingTreeItem.contextValue, { ...context, suppressCreatePick: true });
    }

    await node.edit(context);
}
