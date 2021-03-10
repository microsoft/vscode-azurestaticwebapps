/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { pathExists } from 'fs-extra';
import { join } from 'path';
import { workspace } from 'vscode';
import { AzExtTreeItem, AzureAccountTreeItemBase, IActionContext, ISubscriptionContext } from 'vscode-azureextensionui';
import { configFileName, enableLocalProjectView } from '../constants';
import { getWorkspaceSetting } from '../utils/settingsUtils';
import { LocalProjectTreeItem } from './localProject/LocalProjectTreeItem';
import { StaticWebAppTreeItem } from './StaticWebAppTreeItem';
import { SubscriptionTreeItem } from './SubscriptionTreeItem';

export class AzureAccountTreeItemWithProjects extends AzureAccountTreeItemBase {
    public constructor(testAccount?: {}) {
        super(undefined, testAccount);
    }

    public createSubscriptionTreeItem(root: ISubscriptionContext): SubscriptionTreeItem {
        return new SubscriptionTreeItem(this, root);
    }

    public async loadMoreChildrenImpl(clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        const children: AzExtTreeItem[] = await super.loadMoreChildrenImpl(clearCache, context);

        if (getWorkspaceSetting(enableLocalProjectView)) {
            for (const workspaceFolder of workspace.workspaceFolders || []) {
                const workspaceFolderPath: string = workspaceFolder.uri.fsPath;
                const configFilePathExists: boolean = await pathExists(join(workspaceFolderPath, configFileName));

                if (configFilePathExists) {
                    const localProjectTreeItem: LocalProjectTreeItem = new LocalProjectTreeItem(this, workspaceFolderPath);
                    children.push(localProjectTreeItem);
                }
            }
        }

        return children;
    }

    public compareChildrenImpl(item1: AzExtTreeItem, item2: AzExtTreeItem): number {
        if (item1 instanceof LocalProjectTreeItem && !(item2 instanceof LocalProjectTreeItem)) {
            return 1;
        } else if (!(item1 instanceof LocalProjectTreeItem) && item2 instanceof LocalProjectTreeItem) {
            return -1;
        } else {
            return super.compareChildrenImpl(item1, item2);
        }
    }

    public async findStaticWebAppTreeItem(context: IActionContext, repositoryUrl: string): Promise<StaticWebAppTreeItem | undefined> {
        const children: AzExtTreeItem[] = await this.loadAllChildren(context);
        for (const child of children) {
            if (child instanceof SubscriptionTreeItem) {
                const staticWebAppTreeItems: StaticWebAppTreeItem[] = <StaticWebAppTreeItem[]>await child.loadAllChildren(context);
                for (const staticWebAppTreeItem of staticWebAppTreeItems) {
                    if (staticWebAppTreeItem.repositoryUrl === repositoryUrl) {
                        return staticWebAppTreeItem;
                    }
                }
            }
        }
        return undefined;
    }
}
