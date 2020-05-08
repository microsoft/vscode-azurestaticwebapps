/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { commands, extensions } from 'vscode';
import { IActionContext } from 'vscode-azureextensionui';
import { ext } from '../extensionVariables';
import { localize } from '../utils/localize';

export async function validateFuncExtInstalled(context: IActionContext): Promise<void> {
    context.errorHandling.suppressDisplay = true;
    context.telemetry.suppressIfSuccessful = true;

    const azFuncExtId: string = 'ms-azuretools.vscode-azurefunctions';
    if (extensions.getExtension(azFuncExtId) === undefined) {
        const functionsRequired: string = localize('functionsRequired', 'You must have the "Azure Functions" extension installed to perform this operation.');
        await ext.ui.showWarningMessage(functionsRequired, { title: localize('install', 'Install') });
        const commandToRun: string = 'extension.open';
        commands.executeCommand(commandToRun, azFuncExtId);
        throw new Error(functionsRequired);
    }
}
