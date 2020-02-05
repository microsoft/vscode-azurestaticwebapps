/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { window } from 'vscode';
import { IActionContext, UserCancelledError } from 'vscode-azureextensionui';
import { ext } from '../extensionVariables';
import { ResourceGroupTreeItem } from '../tree/ResourceGroupTreeItem';
import { localize } from '../utils/localize';

export async function deleteResourceGroup(context: IActionContext, primaryNode?: ResourceGroupTreeItem, selectedNodes?: ResourceGroupTreeItem[]): Promise<void> {
    if (!selectedNodes) {
        if (primaryNode) {
            selectedNodes = [primaryNode];
        } else {
            selectedNodes = await ext.tree.showTreeItemPicker<ResourceGroupTreeItem>(ResourceGroupTreeItem.contextValue, { ...context, canPickMany: true, suppressCreatePick: true });
        }
    } else {
        selectedNodes = selectedNodes.filter(n => n instanceof ResourceGroupTreeItem);
    }

    for (const node of selectedNodes) {
        const enterToDelete: string = localize('enterToDelete', 'Enter "{0}" to delete this resource group and all it\'s resources.', node.name);
        function validateInput(val: string | undefined): string | undefined {
            return val === node.name ? undefined : enterToDelete;
        }
        const result: string = await ext.ui.showInputBox({ prompt: enterToDelete, validateInput });
        if (result !== node.name) { // Check again just in case `validateInput` didn't prevent the input box from closing
            context.telemetry.properties.cancelStep = 'mismatchDelete';
            throw new UserCancelledError();
        }
        // don't wait
        // tslint:disable-next-line: no-floating-promises
        node.deleteTreeItem(context);
        window.showInformationMessage(localize('startedDelete', 'Started delete of resource group "{0}".', node.name));
    }
}
