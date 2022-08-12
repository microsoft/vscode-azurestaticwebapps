/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtTreeItem, IActionContext } from '@microsoft/vscode-azext-utils';
import { swaFilter } from '../constants';
import { ext } from '../extensionVariables';

export async function deleteNode(context: IActionContext, expectedContextValue: string | RegExp, node?: AzExtTreeItem): Promise<void> {
    if (!node) {
        node = await ext.rgApi.pickAppResource<AzExtTreeItem>({ ...context, suppressCreatePick: true }, {
            filter: swaFilter,
            expectedChildContextValue: expectedContextValue
        });
    }

    if (node.branchItem) {
        await node.branchItem.delete(context);
    } else {
        await node.deleteTreeItem(context);
    }

}
