/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { IActionContext } from "@microsoft/vscode-azext-utils";
import { installSwaCliUrl } from "../../constants";
import { cpUtils } from "../../utils/cpUtils";

export async function verifyHasNpm(context: IActionContext, message?: string): Promise<boolean> {
    if (await hasNpm()) {
        return true;
    }

    if (message) {
        await context.ui.showWarningMessage(message, {
            modal: true,
            learnMoreLink: installSwaCliUrl
        });
    }

    return false;
}

async function hasNpm(): Promise<boolean> {
    try {
        await cpUtils.executeCommand(undefined, undefined, 'npm', '--version');
        return true;
    } catch (e) {
        return false;
    }
}
