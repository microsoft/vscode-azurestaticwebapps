/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext } from '@microsoft/vscode-azext-utils';

export interface QuickPickWizardContext<T> extends IActionContext {
    pickedNodes: T[];
}

export function getLastNode<T>(context: QuickPickWizardContext<T>): T | undefined {
    if (context.pickedNodes.length) {
        return context.pickedNodes[context.pickedNodes.length - 1];
    }

    return undefined;
}
