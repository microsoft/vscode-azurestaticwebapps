/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext } from 'vscode-azureextensionui';
import { ext } from '../../extensionVariables';
import { AppSettingTreeItem } from '../../tree/AppSettingTreeItem';

export async function renameAppSetting(context: IActionContext, node?: AppSettingTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<AppSettingTreeItem>(AppSettingTreeItem.contextValue, context);
    }

    await node.rename(context);
}
