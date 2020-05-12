/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fse from 'fs-extra';
import { IActionContext } from "vscode-azureextensionui";
import { localSettingsFileName } from "../../constants";
import { ext } from "../../extensionVariables";
import { ConfigurationsTreeItem, staticConfigurations } from '../../tree/ConfigurationsTreeItem';
import { localize } from "../../utils/localize";
import { nonNullValue } from '../../utils/nonNull';
import { confirmOverwriteSettings } from "./confirmOverwriteSettings";
import { getLocalSettingsFile } from "./getLocalSettingsFile";

interface ILocalSettingsJson {
    IsEncrypted?: boolean;
    Values?: { [key: string]: string };
    ConnectionStrings?: { [key: string]: string };
}

export async function uploadAppSettings(context: IActionContext, node?: ConfigurationsTreeItem, folderName?: string): Promise<void> {
    const localSettingsPath: string = await getLocalSettingsFile(folderName);
    if (!node) {
        node = await ext.tree.showTreeItemPicker<ConfigurationsTreeItem>(ConfigurationsTreeItem.contextValue, context);
    }

    await node.runWithTemporaryDescription(localize('uploading', 'Uploading...'), async () => {
        const configNode: ConfigurationsTreeItem = nonNullValue(node);
        ext.outputChannel.show(true);
        ext.outputChannel.appendLog(localize('uploadStart', 'Uploading settings to "{0}"...', node?.parent?.label));
        const localSettings: ILocalSettingsJson = <ILocalSettingsJson>await fse.readJson(localSettingsPath);

        if (localSettings.Values) {
            const remoteSettings: staticConfigurations = await configNode.listApplicationSettings();
            if (!remoteSettings.properties) {
                remoteSettings.properties = {};
            }

            await confirmOverwriteSettings(localSettings.Values, remoteSettings.properties, configNode.label);

            await configNode.updateApplicationSettings(remoteSettings);
        } else {
            throw new Error(localize('noSettings', 'No settings found in "{0}".', localSettingsFileName));
        }
    });
}
