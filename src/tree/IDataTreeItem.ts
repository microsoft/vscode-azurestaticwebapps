import { AzureTreeItem } from "vscode-azureextensionui";

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export interface IDataTreeItem extends AzureTreeItem {
    data: {} | undefined;

    // gets called if data is undefined
    getDataImpl?(): Promise<void>;
}
