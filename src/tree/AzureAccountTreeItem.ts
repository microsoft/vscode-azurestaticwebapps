/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { pathExists } from 'fs-extra';
import { join } from 'path';
import { workspace } from 'vscode';
import { AzExtTreeItem, AzureAccountTreeItemBase, IActionContext, ISubscriptionContext } from 'vscode-azureextensionui';
import { configFileName } from '../constants';
import { LocalProjectTreeItem } from './localProject/LocalProjectTreeItem';
import { SubscriptionTreeItem } from './SubscriptionTreeItem';

export class AzureAccountTreeItemWithProject extends AzureAccountTreeItemBase {
    public constructor(testAccount?: {}) {
        super(undefined, testAccount);
    }

    public createSubscriptionTreeItem(root: ISubscriptionContext): SubscriptionTreeItem {
        return new SubscriptionTreeItem(this, root);
    }

    public async loadMoreChildrenImpl(clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        const children: AzExtTreeItem[] = await super.loadMoreChildrenImpl(clearCache, context);

        const workspaceFolderPath: string | undefined = workspace.workspaceFolders ? workspace.workspaceFolders[0].uri.fsPath : undefined;
        if (workspaceFolderPath) {
            const configFilePathExists: boolean = await pathExists(join(workspaceFolderPath, configFileName));
            if (configFilePathExists) {
                const localProjectTreeItem: LocalProjectTreeItem = new LocalProjectTreeItem(this, workspaceFolderPath);
                children.push(localProjectTreeItem);
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
}
