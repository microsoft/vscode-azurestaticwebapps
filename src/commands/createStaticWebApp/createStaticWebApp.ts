/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext, ICreateChildImplContext } from 'vscode-azureextensionui';
import { productionEnvironmentName } from '../../constants';
import { ext } from '../../extensionVariables';
import { EnvironmentTreeItem } from '../../tree/EnvironmentTreeItem';
import { StaticWebAppTreeItem } from '../../tree/StaticWebAppTreeItem';
import { SubscriptionTreeItem } from '../../tree/SubscriptionTreeItem';
import { verifyWorkSpace } from '../../utils/workspaceUtils';
import { showSwaCreated } from '../showSwaCreated';
import { IStaticWebAppWizardContext } from './IStaticWebAppWizardContext';
import { postCreateStaticWebApp } from './postCreateStaticWebApp';

export async function createStaticWebApp(context: IActionContext & Partial<ICreateChildImplContext> & Partial<IStaticWebAppWizardContext>, node?: SubscriptionTreeItem): Promise<StaticWebAppTreeItem> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<SubscriptionTreeItem>(SubscriptionTreeItem.contextValue, context);
    }

    if (!context.fromTemplate) {
        await verifyWorkSpace(context);
    }
    const swaNode: StaticWebAppTreeItem = await node.createChild(context);
    void showSwaCreated(swaNode);

    const environmentNode: EnvironmentTreeItem | undefined = <EnvironmentTreeItem | undefined>(await swaNode.loadAllChildren(context)).find(ti => {
        return ti instanceof EnvironmentTreeItem && ti.label === productionEnvironmentName;
    });
    environmentNode && await ext.treeView.reveal(environmentNode, { expand: true });

    void postCreateStaticWebApp(swaNode);
    return swaNode;
}

export async function createStaticWebAppFromTemplate(context: IActionContext, node?: SubscriptionTreeItem): Promise<StaticWebAppTreeItem> {
    return await createStaticWebApp({ ...context, fromTemplate: true }, node);
}

export async function createStaticWebAppAdvanced(context: IActionContext, node?: SubscriptionTreeItem): Promise<StaticWebAppTreeItem> {
    return await createStaticWebApp({ ...context, advancedCreation: true }, node);
}
