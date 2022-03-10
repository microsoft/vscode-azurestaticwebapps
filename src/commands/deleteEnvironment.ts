/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { DialogResponses, IActionContext } from '@microsoft/vscode-azext-utils';
import { AzureResourceGroupsExtensionApi } from '../api';
import { getResourcesApi } from '../getExtensionApi';
import { EnvironmentTreeItem } from '../tree/EnvironmentTreeItem';
import { localize } from '../utils/localize';

export async function deleteEnvironment(context: IActionContext, node?: EnvironmentTreeItem): Promise<void> {
    if (!node) {
        const rgApi: AzureResourceGroupsExtensionApi = await getResourcesApi(context);
        node = await rgApi.tree.showTreeItemPicker<EnvironmentTreeItem>(EnvironmentTreeItem.contextValue, { ...context, suppressCreatePick: true });
    }

    if (node.isProduction) {
        context.errorHandling.suppressReportIssue = true;
        throw new Error(localize('cantDeletePro', 'Cannot delete the production environment directly. Delete the static web app.'));
    }

    const confirmMessage: string = localize('deleteConfirmation', 'Are you sure you want to delete environment "{0}"?', node.label);
    await context.ui.showWarningMessage(confirmMessage, { modal: true }, DialogResponses.deleteResponse);
    await node.deleteTreeItem(context);
}
