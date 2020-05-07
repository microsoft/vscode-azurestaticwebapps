/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtTreeItem, AzureParentTreeItem, IActionContext, TreeItemIconPath } from "vscode-azureextensionui";
import { requestUtils } from "../utils/requestUtils";
import { treeUtils } from "../utils/treeUtils";
import { BuildTreeItem, StaticWebAppBuild } from "./BuildTreeItem";
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
        let builds: StaticWebAppBuild[] = (<{ value: StaticWebAppBuild[] }>JSON.parse(await requestUtils.sendRequest(requestOptions))).value;
        builds = builds.filter((build: StaticWebAppBuild) => {
            // the default build is production, which is the parent node
            if (build.name === 'default') {
                return false;
            }

            return true;
        });

        return await this.createTreeItemsWithErrorHandling(
            builds,
            'invalidStaticBuild',
            build => new BuildTreeItem(this, build),
            build => build.buildId
        );
    }
    public hasMoreChildrenImpl(): boolean {
        return false;
    }
}
