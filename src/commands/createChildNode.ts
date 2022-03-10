/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtParentTreeItem, IActionContext } from '@microsoft/vscode-azext-utils';
import { AzureResourceGroupsExtensionApi } from '../api';
import { getResourcesApi } from '../getExtensionApi';

export async function createChildNode(context: IActionContext, expectedContextValue: string | RegExp, node?: AzExtParentTreeItem): Promise<void> {
    if (!node) {
        const rgApi: AzureResourceGroupsExtensionApi = await getResourcesApi(context);
        node = await rgApi.tree.showTreeItemPicker<AzExtParentTreeItem>(expectedContextValue, context);
    }

    await node.createChild(context);
}
