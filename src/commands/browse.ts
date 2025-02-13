/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext, openUrl } from '@microsoft/vscode-azext-utils';
import { EnvironmentItem } from '../tree/v2/EnvironmentItem';
import { StaticWebAppItem } from '../tree/v2/StaticWebAppItem';
import { pickEnvironment } from '../utils/pickItem/pickEnvironment';

export async function browse(context: IActionContext, item?: StaticWebAppItem | EnvironmentItem | { browseUrl: string }): Promise<void> {
    item ??= await pickEnvironment(context);
    await openUrl(item.browseUrl);
}
