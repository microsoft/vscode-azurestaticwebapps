/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext } from '@microsoft/vscode-azext-utils';
import { commands } from 'vscode';
import { ext } from '../../extensionVariables';
import { StaticWebAppTreeItem } from '../../tree/StaticWebAppTreeItem';

export async function cloneRepo(context: IActionContext, resource?: StaticWebAppTreeItem | string): Promise<void> {
    if (resource === undefined) {
        resource = await ext.tree.showTreeItemPicker<StaticWebAppTreeItem>(StaticWebAppTreeItem.contextValue, context);
    }

    let repoUrl: string;
    if (resource instanceof StaticWebAppTreeItem) {
        repoUrl = resource.repositoryUrl;
    } else {
        repoUrl = resource;
    }

    await commands.executeCommand('git.clone', repoUrl);
}
