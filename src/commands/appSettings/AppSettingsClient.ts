/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementClient, WebSiteManagementModels } from '@azure/arm-appservice';
import { IAppSettingsClient } from 'vscode-azureappservice';
import { ISubscriptionContext } from 'vscode-azureextensionui';
import { EnvironmentTreeItem } from '../../tree/EnvironmentTreeItem';
import { createWebSiteClient } from '../../utils/azureClients';

export class AppSettingsClient implements IAppSettingsClient {

    public isLinux: boolean;
    public ssId: string;
    public fullName: string;
    public resourceGroup: string;
    public root: ISubscriptionContext;
    public prId: string;
    public isBuild: boolean;

    constructor(node: EnvironmentTreeItem) {
        this.ssId = node.id;
        this.fullName = node.parent.name;
        this.resourceGroup = node.parent.resourceGroup;
        this.root = node.root;

        this.prId = node.buildId;
        this.isBuild = !node.isProduction;

        // For IAppSettingsClient, isLinux is used for app settings key validation and Linux app settings restrictions
        // apply to the keys
        this.isLinux = true;
    }

    public async listApplicationSettings(): Promise<WebSiteManagementModels.StaticSitesCreateOrUpdateStaticSiteFunctionAppSettingsResponse> {
        const client: WebSiteManagementClient = await createWebSiteClient(this.root);
        return this.isBuild ? await client.staticSites.listStaticSiteBuildFunctionAppSettings(this.resourceGroup, this.fullName, this.prId) :
            await client.staticSites.listStaticSiteFunctionAppSettings(this.resourceGroup, this.fullName);
    }

    public async updateApplicationSettings(appSettings: WebSiteManagementModels.StaticSitesCreateOrUpdateStaticSiteFunctionAppSettingsResponse): Promise<WebSiteManagementModels.StaticSitesCreateOrUpdateStaticSiteFunctionAppSettingsResponse> {
        const client: WebSiteManagementClient = await createWebSiteClient(this.root);
        return this.isBuild ? await client.staticSites.createOrUpdateStaticSiteBuildFunctionAppSettings(this.resourceGroup, this.fullName, this.prId, appSettings) :
            await client.staticSites.createOrUpdateStaticSiteFunctionAppSettings(this.resourceGroup, this.fullName, appSettings);
    }
}
