/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AppSettingsTreeItem, IAppSettingsClient } from '@microsoft/vscode-azext-azureappservice';
import { IActionContext } from "@microsoft/vscode-azext-utils";
import { AzureResourceGroupsExtensionApi } from '../../api';
import { reservedSettingsPrefixes } from '../../constants';
import { getFunctionsApi, getResourcesApi } from '../../getExtensionApi';
import { localize } from "../../utils/localize";
import { AzureFunctionsExtensionApi } from '../../vscode-azurefunctions.api';

export async function uploadAppSettings(context: IActionContext, node?: AppSettingsTreeItem): Promise<void> {
    const funcApi: AzureFunctionsExtensionApi = await getFunctionsApi(context);
    const rgApi: AzureResourceGroupsExtensionApi = await getResourcesApi(context);

    if (!node) {
        node = await rgApi.tree.showTreeItemPicker<AppSettingsTreeItem>(AppSettingsTreeItem.contextValue, { ...context, suppressCreatePick: true });
    }

    const client: IAppSettingsClient = await node.clientProvider.createClient(context);
    await node.runWithTemporaryDescription(context, localize('uploading', 'Uploading...'), async () => {
        await funcApi.uploadAppSettings(client, reservedSettingsPrefixes);
    });
}
