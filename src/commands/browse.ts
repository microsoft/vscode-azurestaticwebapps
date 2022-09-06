/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { appResourceExperience, AzExtResourceType, IActionContext, TreeItemPicker } from '@microsoft/vscode-azext-utils';
import { ContextValueFilter } from '@microsoft/vscode-azext-utils/hostapi.v2';
import { ext } from '../extensionVariables';
import { EnvironmentItem } from '../tree/EnvironmentItem';
import { StaticWebAppItem } from '../tree/StaticWebAppItem';

export async function browse(context: IActionContext, node?: StaticWebAppItem | EnvironmentItem): Promise<void> {
    if (!node) {
        node = await picker()
            .resource(staticWebApp())
            .child(environment())
            .run(context);
    }

    await node.browse();
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

const staticWebApp = createResourceFilter(AzExtResourceType.StaticWebApps);

function picker(): TreeItemPicker {
    return new TreeItemPicker(ext.rgApiv2.getResourceGroupsTreeDataProvider());
}

async function pickEnvironment(context: IActionContext): Promise<EnvironmentItem> {
    return picker()
        .resource(staticWebApp())
        .child(environment())
        .run(context);
}

function pickAppResource<TPick>(context: IActionContext, type: AzExtResourceType, childFilter?: ContextValueFilter): Promise<TPick> {
    return appResourceExperience<TPick>(
        context,
        ext.rgApiv2.getResourceGroupsTreeDataProvider(),
        type,
        childFilter
    );
}
