/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext } from '@microsoft/vscode-azext-utils';
import { AppResourceFilter } from '../AppResourceFilter';
import { ContextValueFilter } from '../ContextValueFilter';
import { ext } from '../extensionVariables';
import { EnvironmentItem } from '../tree/EnvironmentItem';
import { StaticWebAppItem } from '../tree/StaticWebAppItem';

export async function browse(context: IActionContext, node?: StaticWebAppItem | EnvironmentItem): Promise<void> {
    if (!node) {
        node = await ext.rgApiv2.pickResource<EnvironmentItem>({
            filter: new AppResourceFilter({
                type: 'microsoft.web/staticsites'
            }),
            childFilter: new ContextValueFilter('azureStaticEnvironment')
        })
    }

    await node.browse();
}
