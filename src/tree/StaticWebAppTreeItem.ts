/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { AzExtTreeItem, AzureParentTreeItem, IActionContext, TreeItemIconPath } from "vscode-azureextensionui";
import { ext } from "../extensionVariables";
import { localize } from "../utils/localize";
import { openUrl } from '../utils/openUrl';
import { requestUtils } from "../utils/requestUtils";
import { treeUtils } from "../utils/treeUtils";
import { ConfigurationsTreeItem } from './ConfigurationsTreeItem';
import { EnvironmentsTreeItem } from './EnvironmentsTreeItem';
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

export class StaticWebAppTreeItem extends AzureParentTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'azureStaticWebApp';
    public readonly contextValue: string = StaticWebAppTreeItem.contextValue;
    public readonly data: StaticWebApp;

    public configurationsTreeItem: ConfigurationsTreeItem;
    public environmentsTreeItem: EnvironmentsTreeItem;

    constructor(parent: AzureParentTreeItem, ss: StaticWebApp) {
        super(parent);
        this.data = ss;
        this.configurationsTreeItem = new ConfigurationsTreeItem(this);
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
        return [this.configurationsTreeItem, this.environmentsTreeItem];
    }
    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async deleteTreeItemImpl(): Promise<void> {
        const requestOptions: requestUtils.Request = await requestUtils.getDefaultAzureRequest(`${this.id}?api-version=2019-12-01-preview`, this.root, 'DELETE');
        const deleting: string = localize('deleting', 'Deleting "{0}"...', this.name);

        await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: deleting }, async (): Promise<void> => {
            ext.outputChannel.appendLog(deleting);
            await requestUtils.pollAzureAsyncOperation(requestOptions, this);

            const deleteSucceeded: string = localize('deleteSucceeded', 'Successfully deleted "{0}".', this.name);
            vscode.window.showInformationMessage(deleteSucceeded);
            ext.outputChannel.appendLog(deleteSucceeded);
        });
    }

    public async browse(): Promise<void> {
        await openUrl(`https://${this.description}`);
    }
}
