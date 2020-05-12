/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext } from 'vscode-azureextensionui';
import { ext } from '../../extensionVariables';
import { ConfigurationTreeItem } from '../../tree/ConfigurationTreeItem';

export async function renameAppSetting(context: IActionContext, node?: ConfigurationTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<ConfigurationTreeItem>(ConfigurationTreeItem.contextValue, context);
    }

    await node.rename(context);
}
