/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { commands, Extension, extensions } from 'vscode';
import { IActionContext, parseError } from 'vscode-azureextensionui';
// tslint:disable-next-line: no-submodule-imports
import { AzureExtensionApi, AzureExtensionApiProvider } from 'vscode-azureextensionui/api';
import { ResourceTreeItem } from '../tree/ResourceTreeItem';

export async function revealResource(context: IActionContext, node: ResourceTreeItem): Promise<void> {
    context.telemetry.properties.resourceType = node.data.type;
    context.telemetry.properties.resourceKind = node.data.kind;

    let extensionName: string | undefined;
    const publisher: string = 'ms-azuretools';
    switch (node.data.type?.toLowerCase()) {
        case 'microsoft.documentdb/databaseaccounts':
            extensionName = 'vscode-cosmosdb';
            break;
        case 'microsoft.storage/storageaccounts':
            extensionName = 'vscode-azurestorage';
            break;
        case 'microsoft.web/sites':
            if (node.data.kind?.toLowerCase().includes('functionapp')) {
                extensionName = 'vscode-azurefunctions';
            } else {
                extensionName = 'vscode-azureappservice';
            }
            break;
        case 'microsoft.eventgrid/eventsubscriptions':
        case 'microsoft.eventgrid/topics':
            extensionName = 'vscode-azureeventgrid';
            break;
        default:
    }

    if (extensionName) {
        const extensionId: string = `${publisher}.${extensionName}`;
        const extension: Extension<AzureExtensionApiProvider> | undefined = extensions.getExtension(extensionId);
        if (!extension) {
            await commands.executeCommand('extension.open', extensionId);
        } else {
            try {
                const api: IRevealApi = extension.exports.getApi('*');
                await api.revealTreeItem(node.fullId);
            } catch (error) {
                // ignore
                context.telemetry.properties.revealError = parseError(error).message;
            }
        }
    }
}

interface IRevealApi extends AzureExtensionApi {
    revealTreeItem(resourceId: string): Promise<void>;
}
