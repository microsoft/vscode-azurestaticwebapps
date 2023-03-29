/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { StaticSitesCreateOrUpdateStaticSiteFunctionAppSettingsResponse, WebSiteManagementClient } from '@azure/arm-appservice';
import { AppSettingsClientProvider, IAppSettingsClient } from '@microsoft/vscode-azext-azureappsettings';
import { IActionContext } from '@microsoft/vscode-azext-utils';
import { EnvironmentTreeItem } from '../../tree/EnvironmentTreeItem';
import { createWebSiteClient } from '../../utils/azureClients';

export class SwaAppSettingsClientProvider implements AppSettingsClientProvider {
    private _node: EnvironmentTreeItem;
    constructor(node: EnvironmentTreeItem) {
        this._node = node;
    }

    public async createClient(context: IActionContext): Promise<IAppSettingsClient> {
        const websiteClient = await createWebSiteClient([context, this._node]);
        return new SwaAppSettingsClient(this._node, websiteClient);
    }
}

export class SwaAppSettingsClient implements IAppSettingsClient {
    public fullName: string;
    public isLinux: boolean;

    private _parentName: string;
    private _resourceGroup: string;
    private _prId: string;
    private _isBuild: boolean;
    private _client: WebSiteManagementClient;

    constructor(node: EnvironmentTreeItem, client: WebSiteManagementClient) {
        this._client = client;
        this._parentName = node.parent.name;
        this.fullName = `${this._parentName}/${node.branch}`;
        this._resourceGroup = node.parent.resourceGroup;

        this._prId = node.buildId;
        this._isBuild = !node.isProduction;

        // For IAppSettingsClient, isLinux is used for app settings key validation and Linux app settings restrictions
        // apply to the keys
        this.isLinux = true;
    }

    public async listApplicationSettings(): Promise<StaticSitesCreateOrUpdateStaticSiteFunctionAppSettingsResponse> {
        return this._isBuild ? await this._client.staticSites.listStaticSiteBuildFunctionAppSettings(this._resourceGroup, this._parentName, this._prId) :
            await this._client.staticSites.listStaticSiteFunctionAppSettings(this._resourceGroup, this._parentName);
    }

    public async updateApplicationSettings(appSettings: StaticSitesCreateOrUpdateStaticSiteFunctionAppSettingsResponse): Promise<StaticSitesCreateOrUpdateStaticSiteFunctionAppSettingsResponse> {
        return this._isBuild ? await this._client.staticSites.createOrUpdateStaticSiteBuildFunctionAppSettings(this._resourceGroup, this._parentName, this._prId, appSettings) :
            await this._client.staticSites.createOrUpdateStaticSiteFunctionAppSettings(this._resourceGroup, this._parentName, appSettings);
    }
}
