/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureTreeItem, DialogResponses, IActionContext, TreeItemIconPath } from 'vscode-azureextensionui';
import { ext } from '../extensionVariables';
import { treeUtils } from '../utils/treeUtils';
import { ConfigurationsTreeItem } from './ConfigurationsTreeItem';

/**
 * NOTE: This leverages a command with id `ext.prefix + '.toggleConfigurationVisibility'` that should be registered by each extension
 */
export class ConfigurationTreeItem extends AzureTreeItem {
    public static contextValue: string = 'applicationSettingItem';
    public readonly contextValue: string = ConfigurationTreeItem.contextValue;
    public readonly parent: ConfigurationsTreeItem;

    private _key: string;
    private _value: string;
    private _hideValue: boolean;

    constructor(parent: ConfigurationsTreeItem, key: string, value: string) {
        super(parent);
        this._key = key;
        this._value = value;
        this._hideValue = true;
    }

    public get id(): string {
        return this._key;
    }

    public get label(): string {
        return this._hideValue ? `${this._key}=Hidden value. Click to view.` : `${this._key}=${this._value}`;
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getThemedIconPath('constant');
    }

    public get commandId(): string {
        return ext.prefix + '.toggleConfigurationVisibility';
    }

    public async edit(context: IActionContext): Promise<void> {
        const newValue: string = await ext.ui.showInputBox({
            prompt: `Enter setting value for "${this._key}"`,
            value: this._value
        });

        await this.parent.editSettingItem(this._key, this._key, newValue, context);
        this._value = newValue;
        await this.refresh();
    }

    public async rename(context: IActionContext): Promise<void> {
        const settings: { properties: { [name: string]: string } } = await this.parent.ensureSettings(context);

        const oldKey: string = this._key;
        const newKey: string = await ext.ui.showInputBox({
            prompt: `Enter a new name for "${oldKey}"`,
            value: this._key
            // validateInput: (v?: string): string | undefined => validateConfigurationKey(settings, this.root.client, v, oldKey)
        });

        await this.parent.editSettingItem(oldKey, newKey, this._value, context);
        this._key = newKey;
        await this.refresh();
    }

    public async deleteTreeItemImpl(context: IActionContext): Promise<void> {
        await ext.ui.showWarningMessage(`Are you sure you want to delete setting "${this._key}"?`, { modal: true }, DialogResponses.deleteResponse, DialogResponses.cancel);
        await this.parent.deleteSettingItem(this._key, context);
    }

    public async toggleValueVisibility(): Promise<void> {
        this._hideValue = !this._hideValue;
        await this.refresh();
    }

    public async toggleSlotSetting(): Promise<void> {
        // const slotSettings: SlotConfigNamesResource = await this.root.client.listSlotConfigurationNames();
        // if (!slotSettings.configurationNames) {
        //     slotSettings.configurationNames = [];
        // }
        // const slotSettingIndex: number = slotSettings.configurationNames.findIndex((value: string) => { return value === this._key; });

        // if (slotSettingIndex >= 0) {
        //     slotSettings.configurationNames.splice(slotSettingIndex, 1);
        // } else {
        //     slotSettings.configurationNames.push(this._key);
        // }

        // await this.root.client.updateSlotConfigurationNames(slotSettings);
        // await this.refresh();
    }

    public async refreshImpl(): Promise<void> {
        // const slotSettings: SlotConfigNamesResource = await this.root.client.listSlotConfigurationNames();
        // if (slotSettings.configurationNames && slotSettings.configurationNames.find((value: string) => { return value === this._key; })) {
        //     this.description = localize('slotSetting', 'Slot Setting');
        // } else {
        //     this.description = undefined;
        // }
    }
}
