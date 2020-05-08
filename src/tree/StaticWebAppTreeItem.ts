/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { AzExtTreeItem, AzureParentTreeItem, IActionContext, parseError, TreeItemIconPath } from "vscode-azureextensionui";
import { ext } from "../extensionVariables";
import { localize } from "../utils/localize";
import { openUrl } from '../utils/openUrl';
import { requestUtils } from "../utils/requestUtils";
import { treeUtils } from "../utils/treeUtils";
import { EnvironmentsTreeItem } from './EnvironmentsTreeItem';

// using a custom defined type because the type provided by WebsiteManagementModels.StaticSiteARMResource doesn't match the actual payload
export type StaticWebApp = {
    id: string;
    location: string;
    name: string;
    properties: {
        defaultHostname: string;
        repositoryUrl: string;
        branch: string;
        customDomains: string[];
    };
    sku: {
        name: string;
        tier: string;
    };
    // tslint:disable-next-line:no-reserved-keywords
    type: string;
};

type AzureAsyncOperationResponse = {
    id?: string;
    status: string;
    error?: {
        code: string;
        message: string;
    };
};

export class StaticWebAppTreeItem extends AzureParentTreeItem {
    public static contextValue: string = 'azureStaticWebApp';
    public readonly contextValue: string = StaticWebAppTreeItem.contextValue;
    public readonly data: StaticWebApp;

    public environmentsTreeItem: EnvironmentsTreeItem;

    constructor(parent: AzureParentTreeItem, ss: StaticWebApp) {
        super(parent);
        this.data = ss;
        this.environmentsTreeItem = new EnvironmentsTreeItem(this);
    }

    public get name(): string {
        return this.data.name;
    }

    public get id(): string {
        return this.data.id;
    }

    public get label(): string {
        return this.data.name;
    }

    public get description(): string | undefined {
        return this.data.properties.defaultHostname;
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getThemedIconPath('azure-staticwebapps');
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, _context: IActionContext): Promise<AzExtTreeItem[]> {
        return [this.environmentsTreeItem];
    }
    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async deleteTreeItemImpl(): Promise<void> {
        const requestOptions: requestUtils.Request = await requestUtils.getDefaultAzureRequest(`${this.id}?api-version=2019-12-01-preview`, this.root, 'DELETE');
        const deleting: string = localize('deleting', 'Deleting "{0}"...', this.name);

        await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: deleting }, async (): Promise<void> => {
            ext.outputChannel.appendLog(deleting);

            // weird bug where the delete response always returns "" initially, 2nd request returns the Azure-AsyncOperation response
            // and every time after that, it returns "" again.  Unfortunately, we can't use this.pollAzureAsyncOperation due to this behavior
            let deleteJsonString: string = await requestUtils.sendRequest(requestOptions);
            deleteJsonString = await requestUtils.sendRequest(requestOptions);

            try {
                const deleteRes: AzureAsyncOperationResponse = <AzureAsyncOperationResponse>JSON.parse(deleteJsonString);
                if (deleteRes.error) {
                    throw new Error(deleteRes.error.message);
                }

                // if there's no id, just fallback to old behavior
                if (deleteRes.id) {
                    const deletePollingReq: requestUtils.Request = await requestUtils.getDefaultAzureRequest(`${deleteRes.id}?api-version=2019-12-01-preview`, this.root);
                    await this.pollAzureAsyncOperation(deletePollingReq);
                }

            } catch (error) {
                // swallow JSON parsing errors and assume it succeeded (old behavior)
                if (parseError(error).message !== 'Unexpected end of JSON input') {
                    throw error;
                }
            }

            const deleteSucceeded: string = localize('deleteSucceeded', 'Successfully deleted "{0}".', this.name);
            vscode.window.showInformationMessage(deleteSucceeded);
            ext.outputChannel.appendLog(deleteSucceeded);
        });
    }

    public async browse(): Promise<void> {
        await openUrl(`https://${this.description}`);
    }

    //https://docs.microsoft.com/en-us/azure/azure-resource-manager/management/async-operations
    private async pollAzureAsyncOperation(azureRequest: requestUtils.Request, timeoutInSeconds: number = 60): Promise<AzureAsyncOperationResponse> {
        const maxTime: number = Date.now() + timeoutInSeconds * 1000;
        while (Date.now() < maxTime) {
            const statusJsonString: string = await requestUtils.sendRequest(azureRequest);
            try {
                const operationResponse: AzureAsyncOperationResponse = <AzureAsyncOperationResponse>JSON.parse(statusJsonString);
                if (operationResponse.status !== 'InProgress') {
                    if (operationResponse.error) {
                        throw new Error(operationResponse.error.message);
                    }

                    return operationResponse;
                }
            } catch (error) {
                // swallow JSON parsing errors
            }

            await new Promise<void>((resolve: () => void): NodeJS.Timer => setTimeout(resolve, 1000));
        }

        throw new Error(localize('timedOut', 'Operation Timed Out'));

    }
}
