/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtTreeItem } from "@microsoft/vscode-azext-utils";

export interface IAzureResourceTreeItem extends AzExtTreeItem {
    data: {} | undefined;

    /**
     * Implement this to execute any async code when data is undefined
     */
    getDataImpl?(): Promise<void>;
}
