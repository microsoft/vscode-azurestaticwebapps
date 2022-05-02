/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtTreeItem, IActionContext } from '@microsoft/vscode-azext-utils';
import { swaFilter } from '../../constants';
import { ext } from '../../extensionVariables';

export async function deleteStaticWebApp(context: IActionContext, node?: AzExtTreeItem): Promise<void> {
    if (!node) {
        node = await ext.rgApi.pickAppResource(context, {
            filter: swaFilter,
        });
    }

    await node.deleteTreeItem(context);
}
