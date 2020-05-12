/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtTreeItem, AzureParentTreeItem, IActionContext, TreeItemIconPath } from "vscode-azureextensionui";
import { requestUtils } from "../utils/requestUtils";
import { treeUtils } from "../utils/treeUtils";
import { EnvironmentTreeItem, StaticEnvironment } from "./EnvironmentTreeItem";
import { StaticWebAppTreeItem } from "./StaticWebAppTreeItem";

export class EnvironmentsTreeItem extends AzureParentTreeItem {
    public static contextValue: string = 'azureStaticEnvironments';
    public readonly contextValue: string = EnvironmentsTreeItem.contextValue;

    constructor(parent: StaticWebAppTreeItem) {
        super(parent);
    }

    public get label(): string {
        return 'Environments';
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getIconPath('Azure-Static-Apps-Environments');
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, _context: IActionContext): Promise<AzExtTreeItem[]> {
        const requestOptions: requestUtils.Request = await requestUtils.getDefaultAzureRequest(`${this.parent?.id}/builds?api-version=2019-12-01-preview`, this.root);
        let envs: StaticEnvironment[] = (<{ value: StaticEnvironment[] }>JSON.parse(await requestUtils.sendRequest(requestOptions))).value;
        envs = envs.filter((env: StaticEnvironment) => {
            // the default env is production, which is the parent node
            if (env.name === 'default') {
                return false;
            }

            return true;
        });

        return await this.createTreeItemsWithErrorHandling(
            envs,
            'invalidStaticEnvironment',
            env => new EnvironmentTreeItem(this, env),
            env => env.buildId
        );
    }
    public hasMoreChildrenImpl(): boolean {
        return false;
    }
}
