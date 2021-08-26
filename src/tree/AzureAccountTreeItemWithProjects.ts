/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ThemeIcon } from 'vscode';
import { AzExtTreeItem, AzureAccountTreeItemBase, GenericTreeItem, IActionContext, ISubscriptionContext } from 'vscode-azureextensionui';
import { localize } from '../utils/localize';
import { SubscriptionTreeItem } from './SubscriptionTreeItem';

export class AzureAccountTreeItem extends AzureAccountTreeItemBase {

    private subscriptionTreeItem: SubscriptionTreeItem;

    public constructor(testAccount?: {}) {
        super(undefined, testAccount);
    }

    public createSubscriptionTreeItem(root: ISubscriptionContext): SubscriptionTreeItem {
        this.subscriptionTreeItem = new SubscriptionTreeItem(this, root);
        return this.subscriptionTreeItem;
    }

    public async loadMoreChildrenImpl(clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        const children: AzExtTreeItem[] = await super.loadMoreChildrenImpl(clearCache, context);

        const sampleTreeItem = new GenericTreeItem(this, {
            label: localize('deployASample', 'Deploy a sample for free'),
            contextValue: 'deployASample',
            iconPath: new ThemeIcon('wand'),
            commandId: 'staticWebApps.deploySampleStaticWebApp'
        });
        sampleTreeItem.commandArgs = [undefined];
        children.push(sampleTreeItem);
        return children;
    }
}
