/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext } from '@microsoft/vscode-azext-utils';
import { pickStaticWebApp } from '../pickTreeItem/pickStaticWebApp';
import { EnvironmentItem } from '../tree/EnvironmentItem';
import { StaticWebAppItem } from '../tree/StaticWebAppItem';

export async function browse(context: IActionContext, node?: StaticWebAppItem | EnvironmentItem): Promise<void> {
    if (!node) {
        node = await pickStaticWebApp<EnvironmentItem>(context, {
            include: 'azureStaticEnvironment'
        });
    }

    await node.browse();
}
