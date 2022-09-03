/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtResourceType, IActionContext } from '@microsoft/vscode-azext-utils';
import { ext } from '../../extensionVariables';
import { StaticWebAppItem } from '../../tree/StaticWebAppItem';

export async function deleteStaticWebApp(context: IActionContext, node?: StaticWebAppItem): Promise<void> {
    if (!node) {
        node = await ext.rgApiv2.pickResource2<StaticWebAppItem>(AzExtResourceType.StaticWebApps);
    }

    await node.delete(context);
}
