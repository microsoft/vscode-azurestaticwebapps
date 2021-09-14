/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { swaCliPackageName } from "../../constants";
import { ext } from "../../extensionVariables";
import { cpUtils } from "../../utils/cpUtils";
import { localize } from "../../utils/localize";
import { getInstalledSwaCliVersion } from "./getInstalledSwaCliVersion";

export async function uninstallSwaCli(): Promise<void> {
    ext.outputChannel.show();

    if (await getInstalledSwaCliVersion() === null) {
        throw new Error(localize('notInstalled', 'Cannot uninstall Azure Static Web Apps CLI because it is not installed.'));
    }

    await cpUtils.executeCommand(ext.outputChannel, undefined, 'npm', 'uninstall', '--global', swaCliPackageName);
}
