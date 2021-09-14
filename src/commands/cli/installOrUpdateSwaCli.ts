/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { swaCliPackageName } from "../../constants";
import { ext } from "../../extensionVariables";
import { cpUtils } from "../../utils/cpUtils";

export async function installOrUpdateSwaCli(): Promise<void> {
    ext.outputChannel.show();
    await cpUtils.executeCommand(ext.outputChannel, undefined, 'npm', 'install', '--global', `${swaCliPackageName}@latest`);
}
