/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext, openUrl } from '@microsoft/vscode-azext-utils';
import { swaFilter } from '../../constants';
import { ext } from '../../extensionVariables';
import { EnvironmentTreeItem } from '../../tree/EnvironmentTreeItem';

export async function openGitHubRepo(context: IActionContext, node?: EnvironmentTreeItem): Promise<void> {
    if (!node) {
        node = await ext.rgApi.pickAppResource<EnvironmentTreeItem>(context, {
            filter: swaFilter,
            expectedChildContextValue: EnvironmentTreeItem.contextValue
        });
    }

    await openUrl(`${node.parent.repositoryUrl}/tree/${node.branch}`);
}
