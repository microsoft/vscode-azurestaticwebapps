/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureTreeItem } from "vscode-azureextensionui";

export interface IAzureResourceTreeItem extends AzureTreeItem {
    data: {} | undefined;

    /**
     * Implement this to execute any async code when data is undefined
     */
    getDataImpl?(): Promise<void>;
}
