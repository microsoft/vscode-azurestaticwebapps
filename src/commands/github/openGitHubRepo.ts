/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext } from '@microsoft/vscode-azext-utils';
import { AzureResourceGroupsExtensionApi } from '../../api';
import { getResourcesApi } from '../../getExtensionApi';
import { EnvironmentTreeItem } from '../../tree/EnvironmentTreeItem';
import { openUrl } from '../../utils/openUrl';

export async function openGitHubRepo(context: IActionContext, node?: EnvironmentTreeItem): Promise<void> {
    if (!node) {
        const rgApi: AzureResourceGroupsExtensionApi = await getResourcesApi(context);
        node = await rgApi.tree.showTreeItemPicker<EnvironmentTreeItem>(EnvironmentTreeItem.contextValue, context);
    }

    await openUrl(`${node.parent.repositoryUrl}/tree/${node.branch}`);
}
