/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtTreeItem, IActionContext } from '@microsoft/vscode-azext-utils';
import { ext } from '../../extensionVariables';
import { ActionsTreeItem } from '../../tree/ActionsTreeItem';
import { ResolvedStaticWebAppTreeItem, StaticWebAppTreeItem } from '../../tree/StaticWebAppTreeItem';
import { openUrl } from '../../utils/openUrl';

export async function showActions(context: IActionContext, node?: ResolvedStaticWebAppTreeItem | ActionsTreeItem): Promise<void> {
    if (!node) {
        node = await ext.rgApi.tree.showTreeItemPicker<ResolvedStaticWebAppTreeItem & AzExtTreeItem>(new RegExp(StaticWebAppTreeItem.contextValue), context);
    }

    await openUrl(`${node.repositoryUrl}/actions`);
}
