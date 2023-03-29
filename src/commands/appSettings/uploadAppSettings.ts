/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AppSettingsTreeItem, IAppSettingsClient } from "@microsoft/vscode-azext-azureappsettings";
import { IActionContext } from "@microsoft/vscode-azext-utils";
import { reservedSettingsPrefixes, swaFilter } from '../../constants';
import { ext } from "../../extensionVariables";
import { getFunctionsApi } from '../../getExtensionApi';
import { localize } from "../../utils/localize";
import { AzureFunctionsExtensionApi } from '../../vscode-azurefunctions.api';

export async function uploadAppSettings(context: IActionContext, node?: AppSettingsTreeItem): Promise<void> {
    const funcApi: AzureFunctionsExtensionApi = await getFunctionsApi(context);

    if (!node) {
        node = await ext.rgApi.pickAppResource<AppSettingsTreeItem>({ ...context, suppressCreatePick: true }, {
            filter: swaFilter,
            expectedChildContextValue: new RegExp(AppSettingsTreeItem.contextValue)
        });
    }

    const client: IAppSettingsClient = await node.clientProvider.createClient(context);
    await node.runWithTemporaryDescription(context, localize('uploading', 'Uploading...'), async () => {
        await funcApi.uploadAppSettings(client, reservedSettingsPrefixes);
    });
}
