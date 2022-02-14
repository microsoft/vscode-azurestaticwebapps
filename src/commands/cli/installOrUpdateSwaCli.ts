/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { IActionContext } from "@microsoft/vscode-azext-utils";
import { swaCliPackageName } from "../../constants";
import { ext } from "../../extensionVariables";
import { cpUtils } from "../../utils/cpUtils";
import { localize } from "../../utils/localize";
import { verifyHasNpm } from "./verifyHasNpm";

export async function installOrUpdateSwaCli(context: IActionContext): Promise<void> {
    if (await verifyHasNpm(context, localize('needNpmToInstall', 'Node.JS and npm are required to install the Azure Static Web Apps CLI'))) {
        ext.outputChannel.show();
        await cpUtils.executeCommand(ext.outputChannel, undefined, 'npm', 'install', '--global', `${swaCliPackageName}@latest`);
    }
}
