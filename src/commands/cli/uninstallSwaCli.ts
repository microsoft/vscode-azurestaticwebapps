/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { IActionContext } from "@microsoft/vscode-azext-utils";
import { swaCliPackageName } from "../../constants";
import { ext } from "../../extensionVariables";
import { cpUtils } from "../../utils/cpUtils";
import { localize } from "../../utils/localize";
import { getInstalledSwaCliVersion } from "./getInstalledSwaCliVersion";
import { verifyHasNpm } from "./verifyHasNpm";

export async function uninstallSwaCli(context: IActionContext): Promise<void> {
    if (await verifyHasNpm(context, localize('needNpmToUninstall', 'Node.JS and npm are required to uninstall the Azure Static Web Apps CLI'))) {
        if (await getInstalledSwaCliVersion() === null) {
            throw new Error(localize('notInstalled', 'Cannot uninstall Azure Static Web Apps CLI because it is not installed with npm.'));
        }

        ext.outputChannel.show();
        await cpUtils.executeCommand(ext.outputChannel, undefined, 'npm', 'uninstall', '--global', swaCliPackageName);
    }
}
