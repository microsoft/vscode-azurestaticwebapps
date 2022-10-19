/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext, nonNullProp, nonNullValue, openReadOnlyJson } from '@microsoft/vscode-azext-utils';
import { IAzureResourceTreeItem } from '../tree/IAzureResourceTreeItem';
import { localize } from '../utils/localize';

export async function viewProperties(_context: IActionContext, treeItem?: IAzureResourceTreeItem): Promise<void> {
    const node = nonNullValue(treeItem);

    if (!node.data) {
        if (node.getDataImpl) {
            await node.getDataImpl();
        } else {
            throw new Error(localize('No data exists on resource "{0}"', node.label));
        }
    }

    await openReadOnlyJson(node, nonNullProp(node, 'data'));
}
