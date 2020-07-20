/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { TreeItemIconPath } from 'vscode-azureextensionui';
import { Conclusion, Status } from '../constants';
import { ext } from '../extensionVariables';

export namespace treeUtils {
    export function getActionIconPath(status: Status, conclusion: Conclusion): TreeItemIconPath {
        return conclusion !== null ? getThemedIconPath(path.join('conclusions', conclusion)) : getThemedIconPath(path.join('statuses', status));
    }

    export function getIconPath(iconName: string): TreeItemIconPath {
        return path.join(getResourcesPath(), `${iconName}.svg`);
    }

    export function getThemedIconPath(iconName: string): TreeItemIconPath {
        return {
            light: path.join(getResourcesPath(), 'light', `${iconName}.svg`),
            dark: path.join(getResourcesPath(), 'dark', `${iconName}.svg`)
        };
    }

    function getResourcesPath(): string {
        return ext.context.asAbsolutePath('resources');
    }
}
