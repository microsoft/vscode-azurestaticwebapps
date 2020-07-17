/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IncomingMessage } from 'ms-rest';
import * as vscode from 'vscode';
import { AzExtTreeItem, AzureParentTreeItem, IActionContext, TreeItemIconPath } from "vscode-azureextensionui";
import { productionEnvironmentName } from '../constants';
import { ext } from "../extensionVariables";
import { delay } from '../utils/delay';
import { getRepoFullname } from '../utils/gitHubUtils';
import { localize } from "../utils/localize";
import { openUrl } from '../utils/openUrl';
import { requestUtils } from "../utils/requestUtils";
import { treeUtils } from "../utils/treeUtils";
import { EnvironmentTreeItem, StaticEnvironment } from './EnvironmentTreeItem';
import { IAzureResourceTreeItem } from './IAzureResourceTreeItem';

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

export class StaticWebAppTreeItem extends AzureParentTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'azureStaticWebApp';
    public readonly contextValue: string = StaticWebAppTreeItem.contextValue;
    public readonly data: StaticWebApp;
    public readonly childTypeLabel: string = localize('environment', 'Environment');

    constructor(parent: AzureParentTreeItem, ss: StaticWebApp) {
        super(parent);
        this.data = ss;
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
        const { owner, name } = getRepoFullname(this.repositoryUrl);
        return `${owner}/${name}`;
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getThemedIconPath('azure-staticwebapps');
    }

    public get repositoryUrl(): string {
        return this.data.properties.repositoryUrl;
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, _context: IActionContext): Promise<AzExtTreeItem[]> {
        const requestOptions: requestUtils.Request = await requestUtils.getDefaultAzureRequest(`${this.id}/builds?api-version=2019-12-01-preview`, this.root);
        const envs: StaticEnvironment[] = (<{ value: StaticEnvironment[] }>JSON.parse(await requestUtils.sendRequest(requestOptions))).value;

        return await this.createTreeItemsWithErrorHandling(
            envs,
            'invalidStaticEnvironment',
            env => new EnvironmentTreeItem(this, env),
            env => env.buildId
        );
    }

    public compareChildrenImpl(ti1: AzExtTreeItem, ti2: AzExtTreeItem): number {
        // production environment should always be on top
        if (ti1.label === productionEnvironmentName) {
            return -1;
        } else if (ti2.label === productionEnvironmentName) {
            return 1;
        }

        return super.compareChildrenImpl(ti1, ti2);
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async deleteTreeItemImpl(): Promise<void> {
        const requestOptions: requestUtils.Request = await requestUtils.getDefaultAzureRequest(`${this.id}?api-version=2019-12-01-preview`, this.root, 'DELETE');
        const deleting: string = localize('deleting', 'Deleting static web app "{0}"...', this.name);

        await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: deleting }, async (): Promise<void> => {
            ext.outputChannel.appendLog(deleting);
            await this.pollAzureAsyncOperation(requestOptions);

            const deleteSucceeded: string = localize('deleteSucceeded', 'Successfully deleted static web app "{0}".', this.name);
            vscode.window.showInformationMessage(deleteSucceeded);
            ext.outputChannel.appendLog(deleteSucceeded);
        });
    }

    public async browse(): Promise<void> {
        await openUrl(`https://${this.data.properties.defaultHostname}`);
    }

    //https://docs.microsoft.com/en-us/azure/azure-resource-manager/management/async-operations
    private async pollAzureAsyncOperation(asyncOperationRequest: requestUtils.Request): Promise<void> {
        asyncOperationRequest.resolveWithFullResponse = true;
        const asyncAzureRes: IncomingMessage = await requestUtils.sendRequest(asyncOperationRequest);
        const monitorStatusUrl: string = <string>asyncAzureRes.headers['azure-asyncoperation'];
        // the url already includes resourceManagerEndpointUrl, so just use getDefaultRequest instead
        const monitorStatusReq: requestUtils.Request = await requestUtils.getDefaultRequest(monitorStatusUrl, this.root.credentials);

        const timeoutInSeconds: number = 60;
        const maxTime: number = Date.now() + timeoutInSeconds * 1000;
        while (Date.now() < maxTime) {
            const statusJsonString: string = await requestUtils.sendRequest(monitorStatusReq);
            let operationResponse: AzureAsyncOperationResponse | undefined;
            try {
                operationResponse = <AzureAsyncOperationResponse>JSON.parse(statusJsonString);
            } catch {
                // swallow JSON parsing errors
            }

            if (operationResponse?.status !== 'InProgress') {
                if (operationResponse?.error) {
                    throw operationResponse.error;
                }
                return;
            }

            await delay(2000);
        }
    }
}
