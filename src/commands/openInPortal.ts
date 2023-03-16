/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AppSettingsTreeItem } from '@microsoft/vscode-azext-azureappsettings';
import { openInPortal as openInPortalUtil } from '@microsoft/vscode-azext-azureutils';
import { IActionContext, nonNullValue } from '@microsoft/vscode-azext-utils';
import { FunctionsTreeItem } from '../tree/FunctionsTreeItem';
import { matchContextValue } from '../utils/contextUtils';

export async function openInPortal(_context: IActionContext, treeItem?: AppSettingsTreeItem | FunctionsTreeItem): Promise<void> {
    const node = nonNullValue(treeItem);

    if (matchContextValue(node.contextValue, [new RegExp(AppSettingsTreeItem.contextValue)])) {
        await openInPortalUtil(node, `${node.parent?.parent?.id}/configurations`);
        return;
    }

    if (matchContextValue(node.contextValue, [new RegExp(FunctionsTreeItem.contextValue)])) {
        await openInPortalUtil(node, `${node.parent?.parent?.id}/${node.id}`);
        return;
    }
}
