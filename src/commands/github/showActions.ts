/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext } from 'vscode-azureextensionui';
import { ext } from '../../extensionVariables';
import { ActionsTreeItem } from '../../tree/ActionsTreeItem';
import { StaticWebAppTreeItem } from '../../tree/StaticWebAppTreeItem';
import { openUrl } from '../../utils/openUrl';

export async function showActions(context: IActionContext, node?: StaticWebAppTreeItem | ActionsTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<StaticWebAppTreeItem>(StaticWebAppTreeItem.contextValue, context);
    }

    await openUrl(`${node.repositoryUrl}/actions`);
}
