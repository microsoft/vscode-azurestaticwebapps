/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext } from '@microsoft/vscode-azext-utils';
import { swaFilter } from '../../constants';
import { ext } from '../../extensionVariables';
import { AppSettingTreeItem } from '../../vscode-azext-azureappservice/AppSettingTreeItem';

export async function renameAppSetting(context: IActionContext, node?: AppSettingTreeItem): Promise<void> {
    if (!node) {
        node = await ext.rgApi.pickAppResource<AppSettingTreeItem>({ ...context, suppressCreatePick: true }, {
            filter: swaFilter,
            expectedChildContextValue: new RegExp(AppSettingTreeItem.contextValue)
        });
    }

    await node.rename(context);
}
