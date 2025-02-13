/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext, openUrl } from '@microsoft/vscode-azext-utils';
import { EnvironmentItem } from '../../tree/v2/EnvironmentItem';
import { pickEnvironment } from '../../utils/pickItem/pickEnvironment';

export async function openGitHubRepo(context: IActionContext, item?: EnvironmentItem | { gitHubUrl: string }): Promise<void> {
    item ??= await pickEnvironment(context);
    await openUrl(item.gitHubUrl);
}
