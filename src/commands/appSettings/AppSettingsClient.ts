/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementClient, WebSiteManagementModels } from '@azure/arm-appservice';
import { IAppSettingsClient } from 'vscode-azureappservice';
import { createAzureClient, ISubscriptionContext } from 'vscode-azureextensionui';
import { EnvironmentTreeItem } from '../../tree/EnvironmentTreeItem';

export class AppSettingsClient implements IAppSettingsClient {

    public isLinux: boolean;
    public ssId: string;
    public fullName: string;
    public resourceGroup: string;
    public root: ISubscriptionContext;

    constructor(node: EnvironmentTreeItem) {
        this.ssId = node.id;
        this.fullName = node.parent.name;
        this.resourceGroup = node.parent.resourceGroup;
        this.root = node.root;

        // For IAppSettingsClient, isLinux is used for app settings key validation.
        // I'm unsure what the Functions Apps are under the hood, but the Linux app settings restrictions do not apply
        // to the keys so isLinux should be considered false
        this.isLinux = false;
    }

    public async listApplicationSettings(): Promise<WebSiteManagementModels.StaticSitesCreateOrUpdateStaticSiteFunctionAppSettingsResponse> {
        const client: WebSiteManagementClient = createAzureClient(this.root, WebSiteManagementClient);
        return await client.staticSites.listStaticSiteFunctionAppSettings(this.resourceGroup, this.fullName);
    }

    public async updateApplicationSettings(appSettings: WebSiteManagementModels.StaticSitesCreateOrUpdateStaticSiteFunctionAppSettingsResponse): Promise<WebSiteManagementModels.StaticSitesCreateOrUpdateStaticSiteFunctionAppSettingsResponse> {
        const client: WebSiteManagementClient = createAzureClient(this.root, WebSiteManagementClient);
        return await client.staticSites.createOrUpdateStaticSiteFunctionAppSettings(this.resourceGroup, this.fullName, appSettings);
    }
}
