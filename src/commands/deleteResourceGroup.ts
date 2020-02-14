/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { window } from 'vscode';
import { IActionContext, IAzureQuickPickItem, UserCancelledError } from 'vscode-azureextensionui';
import { ext } from '../extensionVariables';
import { ResourceGroupTreeItem } from '../tree/ResourceGroupTreeItem';
import { localize } from '../utils/localize';
import { settingUtils } from '../utils/settingUtils';

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

    const deleteConfirmation: string | undefined = settingUtils.getWorkspaceSetting('deleteConfirmation');
    if (deleteConfirmation === 'QuickPick') {
        const selectGroups: string = localize('selectGroups', 'Select a resource group to confirm deletion.');
        const picks: IAzureQuickPickItem<ResourceGroupTreeItem>[] = selectedNodes.map(n => { return { label: n.name, data: n }; });
        selectedNodes = (await ext.ui.showQuickPick(picks, { placeHolder: selectGroups, canPickMany: true, suppressPersistence: true })).map(p => p.data);
    }

    for (const node of selectedNodes) {
        if (deleteConfirmation === 'WarningDialog') {
            const areYouSureDelete: string = localize('areYouSureDelete', 'Are you sure you want to delete resource group "{0}" and all it\'s resources?', node.name);
            await ext.ui.showWarningMessage(areYouSureDelete, { modal: true }, { title: localize('delete', 'Delete') }); // no need to check result - cancel will throw error
        } else if (deleteConfirmation !== 'QuickPick') {
            const enterToDelete: string = localize('enterToDelete', 'Enter "{0}" to delete this resource group and all it\'s resources.', node.name);
            function validateInput(val: string | undefined): string | undefined {
                return val === node.name ? undefined : enterToDelete;
            }
            const result: string = await ext.ui.showInputBox({ prompt: enterToDelete, validateInput });
            if (result !== node.name) { // Check again just in case `validateInput` didn't prevent the input box from closing
                context.telemetry.properties.cancelStep = 'mismatchDelete';
                throw new UserCancelledError();
            }
        }

        // don't wait
        // tslint:disable-next-line: no-floating-promises
        node.deleteTreeItem(context);
        window.showInformationMessage(localize('startedDelete', 'Started delete of resource group "{0}".', node.name));
    }
}
