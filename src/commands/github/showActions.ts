/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtTreeItem, IActionContext } from '@microsoft/vscode-azext-utils';
import { ext } from '../../extensionVariables';
import { ResolvedStaticWebApp } from '../../StaticWebAppResolver';
import { ActionsTreeItem } from '../../tree/ActionsTreeItem';
import { StaticWebAppTreeItem } from '../../tree/StaticWebAppTreeItem';
import { openUrl } from '../../utils/openUrl';

export async function showActions(context: IActionContext, node?: ResolvedStaticWebApp | ActionsTreeItem): Promise<void> {
    if (!node) {
        node = await ext.rgApi.appResourceTree.showTreeItemPicker<ResolvedStaticWebApp & AzExtTreeItem>(new RegExp(StaticWebAppTreeItem.contextValue), context) as ResolvedStaticWebApp;
    }

    await openUrl(`${node.repositoryUrl}/actions`);
}
