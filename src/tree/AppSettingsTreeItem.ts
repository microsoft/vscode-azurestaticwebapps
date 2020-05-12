/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureParentTreeItem, AzureTreeItem, IActionContext, ICreateChildImplContext, TreeItemIconPath } from 'vscode-azureextensionui';
import { ext } from '../extensionVariables';
import { requestUtils } from '../utils/requestUtils';
import { treeUtils } from '../utils/treeUtils';
import { AppSettingTreeItem } from './AppSettingTreeItem';
import { IAzureResourceTreeItem } from './IAzureResourceTreeItem';

export function validateConfigurationKey(settings: staticAppSettings, newKey?: string, oldKey?: string): string | undefined {
    newKey = newKey ? newKey : '';

    newKey = newKey.trim();
    if (newKey.length === 0) {
        return 'App setting names must have at least one non-whitespace character.';
    }

    oldKey = oldKey ? oldKey.trim().toLowerCase() : oldKey;
    if (settings.properties && newKey.toLowerCase() !== oldKey) {
        for (const key of Object.keys(settings.properties)) {
            if (key.toLowerCase() === newKey.toLowerCase()) {
                return `Setting "${newKey}" already exists.`;
            }
        }
    }

    return undefined;
}

export type staticAppSettings = {
    id: string;
    location: string;
    name: string;
    properties?: { [key: string]: string };
};

export class AppSettingsTreeItem extends AzureParentTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'azureStaticAppSettings';
    public readonly label: string = 'Application Settings';
    public readonly childTypeLabel: string = 'App Setting';
    public readonly contextValue: string = AppSettingsTreeItem.contextValue;
    private _settings: staticAppSettings | undefined;

    public get id(): string {
        return 'configurations';
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getThemedIconPath('settings');
    }

    public get data(): staticAppSettings | undefined {
        return this._settings;
    }

    public async getDataImpl(): Promise<void> {
        if (!this._settings) {
            this._settings = await this.listApplicationSettings();
        }
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async loadMoreChildrenImpl(_clearCache: boolean): Promise<AzureTreeItem[]> {
        this._settings = await this.listApplicationSettings();
        // tslint:disable-next-line: strict-boolean-expressions
        const properties: { [name: string]: string } = this._settings.properties || {};
        return Object.keys(properties).map(key => {
            return new AppSettingTreeItem(this, key, properties[key]);
        });
    }

    public async editSettingItem(oldKey: string, newKey: string, value: string, context: IActionContext): Promise<void> {
        // make a deep copy so settings are not cached if there's a failure
        const settings: staticAppSettings = <staticAppSettings>JSON.parse(JSON.stringify(await this.ensureSettings(context)));
        if (settings.properties) {
            if (oldKey !== newKey) {
                delete settings.properties[oldKey];
            }
            settings.properties[newKey] = value;
        }

        await this.updateApplicationSettings(settings);
    }

    public async deleteSettingItem(key: string, context: IActionContext): Promise<void> {
        // make a deep copy so settings are not cached if there's a failure
        const settings: staticAppSettings = <staticAppSettings>JSON.parse(JSON.stringify(await this.ensureSettings(context)));

        if (settings.properties) {
            delete settings.properties[key];
        }

        await this.updateApplicationSettings(settings);
    }

    public async createChildImpl(context: ICreateChildImplContext): Promise<AzureTreeItem> {
        // make a deep copy so settings are not cached if there's a failure
        const settings: staticAppSettings = <staticAppSettings>JSON.parse(JSON.stringify(await this.ensureSettings(context)));
        const newKey: string = await ext.ui.showInputBox({
            prompt: 'Enter new setting key',
            validateInput: (v?: string): string | undefined => validateConfigurationKey(settings, v)
        });

        const newValue: string = await ext.ui.showInputBox({
            prompt: `Enter setting value for "${newKey}"`
        });

        if (!settings.properties) {
            settings.properties = {};
        }

        context.showCreatingTreeItem(newKey);
        settings.properties[newKey] = newValue;

        await this.updateApplicationSettings(settings);

        return new AppSettingTreeItem(this, newKey, newValue);
    }

    public async ensureSettings(context: IActionContext): Promise<staticAppSettings> {
        if (!this._settings) {
            await this.getCachedChildren(context);
        }

        return <staticAppSettings>this._settings;
    }

    public async listApplicationSettings(): Promise<staticAppSettings> {
        const requestOptions: requestUtils.Request = await requestUtils.getDefaultAzureRequest(`${this.parent?.id}/listFunctionAppSettings?api-version=2019-12-01-preview`, this.root, 'POST');
        return <staticAppSettings>JSON.parse(await requestUtils.sendRequest(requestOptions));
    }

    public async updateApplicationSettings(settings: staticAppSettings): Promise<void> {
        const requestOptions: requestUtils.Request = await requestUtils.getDefaultAzureRequest(`${this.parent?.id}/config/functionappsettings?api-version=2019-12-01-preview`, this.root, 'PUT');
        requestOptions.headers['Content-Type'] = 'application/json';
        requestOptions.body = JSON.stringify({ properties: settings.properties });
        this._settings = <staticAppSettings>JSON.parse(await requestUtils.sendRequest(requestOptions));
    }
}
