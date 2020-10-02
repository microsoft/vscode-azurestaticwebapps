/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementClient } from '@azure/arm-appservice';
import { IAppSettingsClient } from 'vscode-azureappservice';
import { createAzureClient, ISubscriptionContext } from 'vscode-azureextensionui';
import { EnvironmentTreeItem } from '../../tree/EnvironmentTreeItem';
import { getResourceGroupFromId } from '../../utils/azureUtils';

export class AppSettingsClient implements IAppSettingsClient {

    public isLinux: boolean;
    public ssId: string;
    public fullName: string;
    public resourceGroup: string;
    public root: ISubscriptionContext;

    constructor(node: EnvironmentTreeItem) {
        this.ssId = node.id;
        this.fullName = node.parent.name;
        this.resourceGroup = getResourceGroupFromId(this.ssId);
        this.root = node.root;

        // For IAppSettingsClient, isLinux is used for app settings key validation.
        // I'm unsure what the Functions Apps are under the hood, but the Linux app settings restrictions do not apply
        // to the keys so isLinux should be considered false
        this.isLinux = false;
    }

    public async listApplicationSettings(): Promise<IStringDictionary> {
        const client: WebSiteManagementClient = createAzureClient(this.root, WebSiteManagementClient);
        return client.staticSites.listStaticSiteFunctionAppSettings(this.resourceGroup, this.fullName);
    }

    public async updateApplicationSettings(appSettings: IStringDictionary): Promise<IStringDictionary> {
        const client: WebSiteManagementClient = createAzureClient(this.root, WebSiteManagementClient);
        return <IStringDictionary>client.staticSites.createOrUpdateStaticSiteFunctionAppSettings(this.resourceGroup, this.fullName, appSettings);
    }
}

export interface IStringDictionary {
    properties?: { [propertyName: string]: string };
}
