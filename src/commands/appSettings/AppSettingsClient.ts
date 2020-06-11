/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IAppSettingsClient } from 'vscode-azureappservice';
import { ISubscriptionContext } from 'vscode-azureextensionui';
import { EnvironmentTreeItem } from '../../tree/EnvironmentTreeItem';
import { requestUtils } from '../../utils/requestUtils';

export class AppSettingsClient implements IAppSettingsClient {

    public fullName: string;
    public isLinux: boolean;
    public swaId: string;
    public root: ISubscriptionContext;

    constructor(node: EnvironmentTreeItem) {
        this.fullName = node.name;
        this.swaId = node.id;
        this.root = node.root;

        // For IAppSettingsClient, isLinux is used for app settings key validation.
        // I'm unsure what the Functions Apps are under the hood, but the Linux app settings restrictions do not apply
        // to the keys so isLinux should be considered false
        this.isLinux = false;
    }

    public async listApplicationSettings(): Promise<IStringDictionary> {
        const requestOptions: requestUtils.Request = await requestUtils.getDefaultAzureRequest(`${this.swaId}/listFunctionAppSettings?api-version=2019-12-01-preview`, this.root, 'POST');
        return <IStringDictionary>JSON.parse(await requestUtils.sendRequest(requestOptions));
    }

    public async updateApplicationSettings(appSettings: IStringDictionary): Promise<IStringDictionary> {
        const requestOptions: requestUtils.Request = await requestUtils.getDefaultAzureRequest(`${this.swaId}/config/functionappsettings?api-version=2019-12-01-preview`, this.root, 'PUT');
        requestOptions.headers['Content-Type'] = 'application/json';
        requestOptions.body = JSON.stringify({ properties: appSettings.properties });
        return <IStringDictionary>JSON.parse(await requestUtils.sendRequest(requestOptions));
    }
}

export interface IStringDictionary {
    properties?: { [propertyName: string]: string };
}
