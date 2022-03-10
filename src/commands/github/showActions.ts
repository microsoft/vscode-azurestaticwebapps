/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext } from '@microsoft/vscode-azext-utils';
import { AzureResourceGroupsExtensionApi } from '../../api';
import { getResourcesApi } from '../../getExtensionApi';
import { ActionsTreeItem } from '../../tree/ActionsTreeItem';
import { StaticWebAppTreeItem } from '../../tree/StaticWebAppTreeItem';
import { openUrl } from '../../utils/openUrl';

export async function showActions(context: IActionContext, node?: StaticWebAppTreeItem | ActionsTreeItem): Promise<void> {
    if (!node) {
        const rgApi: AzureResourceGroupsExtensionApi = await getResourcesApi(context);
        node = await rgApi.tree.showTreeItemPicker<StaticWebAppTreeItem>(StaticWebAppTreeItem.contextValue, context);
    }

    await openUrl(`${node.repositoryUrl}/actions`);
}
