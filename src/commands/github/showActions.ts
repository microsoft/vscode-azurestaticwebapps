/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import  { type AzExtTreeItem, type IActionContext} from '@microsoft/vscode-azext-utils';
import { openUrl } from '@microsoft/vscode-azext-utils';
import  { type ResolvedStaticWebApp } from '../../StaticWebAppResolver';
import { swaFilter } from '../../constants';
import { ext } from '../../extensionVariables';
import  { type ActionsTreeItem } from '../../tree/ActionsTreeItem';

export async function showActions(context: IActionContext, node?: ResolvedStaticWebApp | ActionsTreeItem): Promise<void> {
    if (!node) {
        node = await ext.rgApi.pickAppResource<ResolvedStaticWebApp & AzExtTreeItem>(context, {
            filter: swaFilter,
        }) as ResolvedStaticWebApp;
    }

    await openUrl(`${node.repositoryUrl}/actions`);
}
