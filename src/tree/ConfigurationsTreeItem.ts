/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureParentTreeItem, AzureTreeItem, IActionContext, ICreateChildImplContext, TreeItemIconPath } from 'vscode-azureextensionui';
import { requestUtils } from '../utils/requestUtils';
import { treeUtils } from '../utils/treeUtils';
import { ConfigurationTreeItem } from './ConfigurationTreeItem';

// export function validateConfigurationKey(settings: StringDictionary, client: SiteClient, newKey?: string, oldKey?: string): string | undefined {
//     newKey = newKey ? newKey : '';

//     if (client.isLinux && /[^\w\.]+/.test(newKey)) {
//         return 'App setting names can only contain letters, numbers (0-9), periods ("."), and underscores ("_")';
//     }

//     newKey = newKey.trim();
//     if (newKey.length === 0) {
//         return 'App setting names must have at least one non-whitespace character.';
//     }

//     oldKey = oldKey ? oldKey.trim().toLowerCase() : oldKey;
//     if (settings.properties && newKey.toLowerCase() !== oldKey) {
//         for (const key of Object.keys(settings.properties)) {
//             if (key.toLowerCase() === newKey.toLowerCase()) {
//                 return `Setting "${newKey}" already exists.`;
//             }
//         }
//     }

//     return undefined;
// }

export type staticConfigurations = {
    id: string;
    location: string;
    name: string;
    properties?: { [key: string]: string };
};

export class ConfigurationsTreeItem extends AzureParentTreeItem {
    public static contextValue: string = 'applicationSettings';
    public readonly label: string = 'Application Settings';
    public readonly childTypeLabel: string = 'App Setting';
    public readonly contextValue: string = ConfigurationsTreeItem.contextValue;
    private _settings: staticConfigurations | undefined;

    public get id(): string {
        return 'configuration';
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getThemedIconPath('settings');
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async loadMoreChildrenImpl(_clearCache: boolean): Promise<AzureTreeItem[]> {
        const requestOptions: requestUtils.Request = await requestUtils.getDefaultAzureRequest(`${this.parent?.id}/listFunctionAppSettings?api-version=2019-12-01-preview`, this.root, 'POST');
        this._settings = <staticConfigurations>JSON.parse(await requestUtils.sendRequest(requestOptions));
        const properties: { [name: string]: string } = this._settings.properties || {};
        return Object.keys(properties).map(key => {
            return new ConfigurationTreeItem(this, key, properties[key]);
        });
    }

    public async editSettingItem(oldKey: string, newKey: string, value: string, context: IActionContext): Promise<void> {
        // make a deep copy so settings are not cached if there's a failure
        // tslint:disable-next-line: no-unsafe-any
        const settings: staticConfigurations = <staticConfigurations>JSON.parse(JSON.stringify(await this.ensureSettings(context)));
        if (settings.properties) {
            if (oldKey !== newKey) {
                delete settings.properties[oldKey];
            }
            settings.properties[newKey] = value;
        }

        const requestOptions: requestUtils.Request = await requestUtils.getDefaultAzureRequest(`${this.parent?.id}/config/functionappsettings?api-version=2019-12-01-preview`, this.root, 'PUT');
        requestOptions.headers['Content-Type'] = 'application/json';
        const requestBody: {} = { properties: { appSettings: settings } };
        requestOptions.body = requestBody;
        await requestUtils.pollAzureAsyncOperation(requestOptions, this);

        // this._settings = await this.root.client.updateApplicationSettings(settings);
    }

    public async deleteSettingItem(key: string, context: IActionContext): Promise<void> {
        // make a deep copy so settings are not cached if there's a failure
        // tslint:disable-next-line: no-unsafe-any
        // const settings: StringDictionary = JSON.parse(JSON.stringify(await this.ensureSettings(context)));

        // if (settings.properties) {
        //     delete settings.properties[key];
        // }

        // this._settings = await this.root.client.updateApplicationSettings(settings);
    }

    public async createChildImpl(context: ICreateChildImplContext): Promise<AzureTreeItem> {
        // make a deep copy so settings are not cached if there's a failure
        // tslint:disable-next-line: no-unsafe-any
        // const settings: StringDictionary = JSON.parse(JSON.stringify(await this.ensureSettings(context)));
        // const newKey: string = await ext.ui.showInputBox({
        //     prompt: 'Enter new setting key',
        //     validateInput: (v?: string): string | undefined => validateConfigurationKey(settings, this.root.client, v)
        // });

        // const newValue: string = await ext.ui.showInputBox({
        //     prompt: `Enter setting value for "${newKey}"`
        // });

        // if (!settings.properties) {
        //     settings.properties = {};
        // }

        // context.showCreatingTreeItem(newKey);
        // settings.properties[newKey] = newValue;

        // this._settings = await this.root.client.updateApplicationSettings(settings);

        return await ConfigurationTreeItem.createConfigurationTreeItem(this, 'newKey', 'newValue');
    }

    public async ensureSettings(context: IActionContext): Promise<{ properties: { [name: string]: string } }> {
        if (!this._settings) {
            await this.getCachedChildren(context);
        }

        return <staticConfigurations>this._settings;
    }
}
