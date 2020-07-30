/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ProgressLocation, window } from "vscode";
import { AzExtTreeItem, AzureParentTreeItem, IActionContext, TreeItemIconPath } from "vscode-azureextensionui";
import { productionEnvironmentName } from '../constants';
import { ext } from "../extensionVariables";
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

    public get branch(): string {
        return this.data.properties.branch;
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, _context: IActionContext): Promise<AzExtTreeItem[]> {
        const requestOptions: requestUtils.Request = await requestUtils.getDefaultAzureRequest(`${this.id}/builds?api-version=2019-12-01-preview`, this.root);
        const envs: StaticEnvironment[] = (<{ value: StaticEnvironment[] }>JSON.parse(await requestUtils.sendRequest(requestOptions))).value;

        return await this.createTreeItemsWithErrorHandling(
            envs,
            'invalidStaticEnvironment',
            async (env: StaticEnvironment) => {
                return await EnvironmentTreeItem.createEnvironmentTreeItem(this, env);
            },
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

        await window.withProgress({ location: ProgressLocation.Notification, title: deleting }, async (): Promise<void> => {
            ext.outputChannel.appendLog(deleting);
            await requestUtils.pollAzureAsyncOperation(requestOptions, this.root.credentials);

            const deleteSucceeded: string = localize('deleteSucceeded', 'Successfully deleted static web app "{0}".', this.name);
            window.showInformationMessage(deleteSucceeded);
            ext.outputChannel.appendLog(deleteSucceeded);
        });
    }

    public async browse(): Promise<void> {
        await openUrl(`https://${this.data.properties.defaultHostname}`);
    }
}
