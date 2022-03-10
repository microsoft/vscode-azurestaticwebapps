/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtTreeItem, callWithTelemetryAndErrorHandling, IActionContext } from "@microsoft/vscode-azext-utils";
import { AzureResourceGroupsExtensionApi } from "../../api";
import { getResourcesApi } from "../../getExtensionApi";

export async function revealTreeItem(resourceId: string): Promise<void> {
    return await callWithTelemetryAndErrorHandling('api.revealTreeItem', async (context: IActionContext) => {
        const rgApi: AzureResourceGroupsExtensionApi = await getResourcesApi(context);
        const node: AzExtTreeItem | undefined = await rgApi.tree.findTreeItem(resourceId, { ...context, loadAll: true });
        if (node) {
            await rgApi.treeView.reveal(node, { select: true, focus: true, expand: true });
        }
    });
}
