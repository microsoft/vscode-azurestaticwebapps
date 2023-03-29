/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtTreeItem, IActionContext } from '@microsoft/vscode-azext-utils';
import { commands } from 'vscode';
import { ResolvedStaticWebApp } from '../../StaticWebAppResolver';
import { swaFilter } from '../../constants';
import { ext } from '../../extensionVariables';
import { isResolvedStaticWebAppTreeItem } from '../../tree/StaticWebAppTreeItem';

export async function cloneRepo(context: IActionContext, resource?: string | ResolvedStaticWebApp): Promise<void> {

    if (resource === undefined) {
        resource = await ext.rgApi.pickAppResource<ResolvedStaticWebApp & AzExtTreeItem>(context, {
            filter: swaFilter,
        }) as ResolvedStaticWebApp;
    }

    let repoUrl: string;
    if (isResolvedStaticWebAppTreeItem(resource)) {
        repoUrl = resource.repositoryUrl;
    } else {
        repoUrl = resource;
    }

    await commands.executeCommand('git.clone', repoUrl);
}
