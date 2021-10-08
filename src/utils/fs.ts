/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as fse from 'fs-extra';
import { MessageItem } from 'vscode';
import { DialogResponses, IActionContext, parseError } from 'vscode-azureextensionui';
import { localize } from './localize';

export async function writeFormattedJson(fsPath: string, data: object): Promise<void> {
    await fse.writeJson(fsPath, data, { spaces: 2 });
}

export async function confirmEditJsonFile(context: IActionContext, fsPath: string, editJson: (existingData: {}) => {} | Promise<{}>): Promise<void> {
    let newData: {};
    if (await fse.pathExists(fsPath)) {
        try {
            newData = await editJson(<{}>await fse.readJson(fsPath));
        } catch (error) {
            if (parseError(error).isUserCancelledError) {
                throw error;
            } else if (await confirmOverwriteFile(context, fsPath)) {
                // If we failed to parse or edit the existing file, just ask to overwrite the file completely
                newData = await editJson({});
            } else {
                return;
            }
        }
    } else {
        newData = await editJson({});
    }

    await writeFormattedJson(fsPath, newData);
}

export async function confirmOverwriteFile(context: IActionContext, fsPath: string): Promise<boolean> {
    if (await fse.pathExists(fsPath)) {
        const result: MessageItem | undefined = await context.ui.showWarningMessage(localize('fileAlreadyExists', 'File "{0}" already exists. Overwrite?', fsPath), { modal: true, stepName: 'overwriteFile' }, DialogResponses.yes, DialogResponses.no);
        if (result === DialogResponses.yes) {
            return true;
        } else {
            return false;
        }
    } else {
        return true;
    }
}
