/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AppSettingsTreeItem, IAppSettingsClient } from '@microsoft/vscode-azext-azureappservice';
import { AzExtResourceType, IActionContext, TreeItemPicker } from "@microsoft/vscode-azext-utils";
import { ContextValueFilter } from '@microsoft/vscode-azext-utils/hostapi.v2';
import { reservedSettingsPrefixes } from '../../constants';
import { ext } from "../../extensionVariables";
import { getFunctionsApi } from '../../getExtensionApi';
import { EnvironmentItem } from '../../tree/EnvironmentItem';
import { localize } from "../../utils/localize";
import { AzureFunctionsExtensionApi } from '../../vscode-azurefunctions.api';

export async function uploadAppSettings(context: IActionContext, node?: AppSettingsTreeItem): Promise<void> {
    const funcApi: AzureFunctionsExtensionApi = await getFunctionsApi(context);

    if (!node) {
        // node = await ext.rgApi.pickAppResource<AppSettingsTreeItem>({ ...context, suppressCreatePick: true }, {
        //     filter: swaFilter,
        //     expectedChildContextValue: new RegExp(AppSettingsTreeItem.contextValue)
        // });
        node = await picker()
            .resource(staticWebApp())
            .child(appSettings({ suppressCreate: true }))
            .run(context);
    }

    const client: IAppSettingsClient = await node.clientProvider.createClient(context);
    await node.runWithTemporaryDescription(context, localize('uploading', 'Uploading...'), async () => {
        await funcApi.uploadAppSettings(client, reservedSettingsPrefixes);
    });
}


type TypedResourceFilter<TItem> = () => AzExtResourceType & { item: TItem };

type TypedContextValueFilter<TItem> = () => ContextValueFilter & { item: TItem };

function createResourceFilter<TItem>(type: AzExtResourceType): TypedResourceFilter<TItem> {
    return (() => type) as TypedResourceFilter<TItem>;
}
function createFilter<TItem>(filter: ContextValueFilter): TypedContextValueFilter<TItem> {
    return (() => filter) as TypedContextValueFilter<TItem>;
}

const environment = createFilter<EnvironmentItem>({
    include: 'azureStaticEnvironment'
});

const appSettings = createFilter<AppSettingsTreeItem>({
    include: new RegExp(AppSettingsTreeItem.contextValue)
});

const staticWebApp = createResourceFilter(AzExtResourceType.StaticWebApps);

function picker(): TreeItemPicker {
    return new TreeItemPicker(ext.rgApiv2.getResourceGroupsTreeDataProvider());
}

// async function pickAppSettings(context: IActionContext): Promise<AppSettingsTreeItem> {
//     return picker()
//         .resource(staticWebApp())
//         .child(appSettings())
//         .run(context);
// }
