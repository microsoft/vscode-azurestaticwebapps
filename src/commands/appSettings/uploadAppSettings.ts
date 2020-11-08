/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AppSettingsTreeItem, IAppSettingsClient } from 'vscode-azureappservice';
import { IActionContext } from "vscode-azureextensionui";
import { ext } from "../../extensionVariables";
import { getFunctionsApi } from '../../getExtensionApi';
import { localize } from "../../utils/localize";
import { AzureFunctionsExtensionApi } from '../../vscode-azurefunctions.api';

export async function uploadAppSettings(context: IActionContext, node?: AppSettingsTreeItem): Promise<void> {
    const funcApi: AzureFunctionsExtensionApi = await getFunctionsApi(context);

    if (!node) {
        node = await ext.tree.showTreeItemPicker<AppSettingsTreeItem>(AppSettingsTreeItem.contextValue, { ...context, suppressCreatePick: true });
    }

    const client: IAppSettingsClient = node.client;
    await node.runWithTemporaryDescription(localize('uploading', 'Uploading...'), async () => {
        await funcApi.uploadAppSettings(client);
    });
}
