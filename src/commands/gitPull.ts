/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ext } from "vscode-azureappservice/out/src/extensionVariables";
import { IActionContext } from "vscode-azureextensionui";
import { LocalProjectTreeItem } from "../tree/localProject/LocalProjectTreeItem";
import { cpUtils } from "../utils/cpUtils";

export async function gitPull(context: IActionContext, localProjectTreeItem: LocalProjectTreeItem): Promise<void> {
    ext.outputChannel.show();
    await cpUtils.executeCommand(ext.outputChannel, localProjectTreeItem.projectPath, 'git', 'pull');
    await localProjectTreeItem.refresh(context);
}
