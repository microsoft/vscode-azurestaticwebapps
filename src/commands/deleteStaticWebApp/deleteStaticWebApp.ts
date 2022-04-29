/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtTreeItem, IActionContext } from '@microsoft/vscode-azext-utils';
import { ext } from '../../extensionVariables';

export async function deleteStaticWebApp(context: IActionContext, node?: AzExtTreeItem): Promise<void> {
    if (!node) {
        node = await ext.rgApi.pickAppResource(context, {
            type: 'microsoft.web/staticsites',
        });
    }

    await node.deleteTreeItem(context);
}
