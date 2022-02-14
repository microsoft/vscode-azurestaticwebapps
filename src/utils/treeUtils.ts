/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TreeItemIconPath } from '@microsoft/vscode-azext-utils';
import { Uri } from 'vscode';
import { ext } from '../extensionVariables';

export namespace treeUtils {
    export function getIconPath(iconName: string): TreeItemIconPath {
        return Uri.joinPath(getResourcesUri(), `${iconName}.svg`);
    }

    export function getThemedIconPath(iconName: string): TreeItemIconPath {
        return {
            light: Uri.joinPath(getResourcesUri(), 'light', `${iconName}.svg`),
            dark: Uri.joinPath(getResourcesUri(), 'dark', `${iconName}.svg`)
        };
    }

    function getResourcesUri(): Uri {
        return Uri.joinPath(ext.context.extensionUri, 'resources')
    }
}
