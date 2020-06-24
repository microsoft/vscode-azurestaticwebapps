/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as ui from 'vscode-azureextensionui';
import { ext } from '../../extensionVariables';
import { EnvironmentTreeItem } from '../../tree/EnvironmentTreeItem';
import { StaticWebAppTreeItem } from '../../tree/StaticWebAppTreeItem';
import { openUrl } from '../../utils/openUrl';

export async function showActions(context: ui.IActionContext, node?: StaticWebAppTreeItem | EnvironmentTreeItem): Promise<void> {
    if (node instanceof EnvironmentTreeItem) {
        node = <StaticWebAppTreeItem>node.parent?.parent;
    } else if (!node) {
        node = await ext.tree.showTreeItemPicker<StaticWebAppTreeItem>(StaticWebAppTreeItem.contextValue, context);
    }

    await openUrl(`${node.data.properties.repositoryUrl}/actions`);
}
