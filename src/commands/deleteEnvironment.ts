/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { DialogResponses, IActionContext } from '@microsoft/vscode-azext-utils';
import { swaFilter } from '../constants';
import { ext } from '../extensionVariables';
import { EnvironmentTreeItem } from '../tree/EnvironmentTreeItem';
import { localize } from '../utils/localize';

export async function deleteEnvironment(context: IActionContext, node?: EnvironmentTreeItem): Promise<void> {
    if (!node) {
        node = await ext.rgApi.pickAppResource<EnvironmentTreeItem>({ ...context, suppressCreatePick: true }, {
            filter: swaFilter,
            expectedChildContextValue: EnvironmentTreeItem.contextValue
        });
    }

    if (node.isProduction) {
        context.errorHandling.suppressReportIssue = true;
        throw new Error(localize('cantDeletePro', 'Cannot delete the production environment directly. Delete the static web app.'));
    }

    const confirmMessage: string = localize('deleteConfirmation', 'Are you sure you want to delete environment "{0}"?', node.label);
    await context.ui.showWarningMessage(confirmMessage, { modal: true }, DialogResponses.deleteResponse);
    await node.deleteTreeItem(context);
}
