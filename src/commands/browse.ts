/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext } from '@microsoft/vscode-azext-utils';
import { swaFilter } from '../constants';
import { ext } from '../extensionVariables';
import { EnvironmentTreeItem } from '../tree/EnvironmentTreeItem';
import { ResolvedStaticWebAppTreeItem } from '../tree/StaticWebAppTreeItem';

export async function browse(context: IActionContext, node?: ResolvedStaticWebAppTreeItem | EnvironmentTreeItem): Promise<void> {
    if (!node) {
        node = await ext.rgApi.pickAppResource<EnvironmentTreeItem>(context, {
            filter: swaFilter,
            expectedChildContextValue: EnvironmentTreeItem.contextValue,
        });
    }

    await node.browse();
}
