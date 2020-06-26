/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fse from 'fs-extra';
import { AppSettingsTreeItem } from 'vscode-azureappservice';
import { IActionContext } from "vscode-azureextensionui";
import { localSettingsFileName } from "../../constants";
import { ext } from "../../extensionVariables";
import { localize } from "../../utils/localize";
import { nonNullProp, nonNullValue } from '../../utils/nonNull';
import { IStringDictionary } from './AppSettingsClient';
import { confirmOverwriteSettings } from "./confirmOverwriteSettings";
import { getLocalSettingsFile } from "./getLocalSettingsFile";

interface ILocalSettingsJson {
    IsEncrypted?: boolean;
    Values?: { [key: string]: string };
    ConnectionStrings?: { [key: string]: string };
}

// https://github.com/microsoft/vscode-azurestaticwebapps/issues/62
export async function uploadAppSettings(context: IActionContext, node?: AppSettingsTreeItem): Promise<void> {
    const localSettingsPath: string = await getLocalSettingsFile();
    if (!node) {
        node = await ext.tree.showTreeItemPicker<AppSettingsTreeItem>(AppSettingsTreeItem.contextValue, { ...context, suppressCreatePick: true });
    }

    await node.runWithTemporaryDescription(localize('uploading', 'Uploading...'), async () => {
        const appSettingsNode: AppSettingsTreeItem = nonNullValue(node);
        ext.outputChannel.show(true);
        ext.outputChannel.appendLog(localize('uploadStart', 'Uploading settings to "{0}"...', appSettingsNode.parent?.label));
        const localSettings: ILocalSettingsJson = <ILocalSettingsJson>await fse.readJson(localSettingsPath);

        if (localSettings.Values) {
            const remoteSettings: IStringDictionary = await appSettingsNode.client.listApplicationSettings();
            if (!remoteSettings.properties) {
                remoteSettings.properties = {};
            }

            await confirmOverwriteSettings(localSettings.Values, remoteSettings.properties, nonNullProp(appSettingsNode, 'parent').label);

            await appSettingsNode.client.updateApplicationSettings(remoteSettings);
        } else {
            throw new Error(localize('noSettings', 'No settings found in "{0}".', localSettingsFileName));
        }
    });
}
