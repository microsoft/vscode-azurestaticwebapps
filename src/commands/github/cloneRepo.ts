/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtTreeItem, IActionContext } from '@microsoft/vscode-azext-utils';
import { commands } from 'vscode';
import { ext } from '../../extensionVariables';
import { ResolvedStaticWebApp } from '../../StaticWebAppResolver';
import { isResolvedStaticWebAppTreeItem, StaticWebAppTreeItem } from '../../tree/StaticWebAppTreeItem';

export async function cloneRepo(context: IActionContext, resource?: string | ResolvedStaticWebApp): Promise<void> {

    if (resource === undefined) {
        // include type and kind in all context values, so we're able to pass in StaticWebAppTreeItem.kind here
        resource = await ext.rgApi.appResourceTree.showTreeItemPicker<ResolvedStaticWebApp & AzExtTreeItem>(new RegExp(StaticWebAppTreeItem.contextValue), context) as ResolvedStaticWebApp;
    }

    let repoUrl: string;
    if (isResolvedStaticWebAppTreeItem(resource)) {
        repoUrl = resource.repositoryUrl;
    } else {
        repoUrl = resource;
    }

    await commands.executeCommand('git.clone', repoUrl);
}
