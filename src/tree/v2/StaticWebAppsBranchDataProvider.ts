/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { callWithTelemetryAndErrorHandling, nonNullProp, nonNullValue, type IActionContext } from '@microsoft/vscode-azext-utils';
import { type AzureResource, type AzureResourceBranchDataProvider, type AzureSubscription, type ResourceModelBase, type ViewPropertiesModel } from '@microsoft/vscode-azureresources-api';
import * as vscode from 'vscode';
import { ext } from '../../extensionVariables';
import { localize } from '../../utils/localize';
import { StaticWebAppItem, StaticWebAppModel } from './StaticWebAppItem';

export interface TreeElementBase extends ResourceModelBase {
    getChildren?(): vscode.ProviderResult<TreeElementBase[]>;
    getTreeItem(): vscode.TreeItem | Thenable<vscode.TreeItem>;

    viewProperties?: ViewPropertiesModel;
}

export interface StaticWebAppsItem extends TreeElementBase {
    subscription: AzureSubscription;
    staticWebApp: StaticWebAppModel;
}

export class StaticWebAppsBranchDataProvider extends vscode.Disposable implements AzureResourceBranchDataProvider<TreeElementBase> {
    private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<TreeElementBase | undefined>();

    constructor() {
        super(
            () => {
                this.onDidChangeTreeDataEmitter.dispose();
            },
        );
    }

    get onDidChangeTreeData(): vscode.Event<TreeElementBase | undefined> {
        return this.onDidChangeTreeDataEmitter.event;
    }

    async getChildren(element: TreeElementBase): Promise<TreeElementBase[] | null | undefined> {
        return (await element.getChildren?.())?.map((child) => {
            if (child.id) {
                return ext.state.wrapItemInStateHandling(child as TreeElementBase & { id: string }, () => this.refresh(child))
            }
            return child;
        });
    }

    async getResourceItem(element: AzureResource): Promise<TreeElementBase> {
        const maybeSwaItem: StaticWebAppItem | undefined = await callWithTelemetryAndErrorHandling(
            'staticWebApps.branchDataProvider.getResourceItem',
            async (context: IActionContext) => {
                context.errorHandling.rethrow = true;

                const staticWebApp: StaticWebAppModel = await StaticWebAppItem.Get(context, element.subscription, nonNullProp(element, 'resourceGroup'), element.name);
                return new StaticWebAppItem(context, element.subscription, StaticWebAppItem.CreateStaticWebAppModel(staticWebApp));
            },
        );

        const swaItem: StaticWebAppItem = nonNullValue(maybeSwaItem, localize('noSwaItem', `Failed to retrieve static web app "${element.name}"`));
        return ext.state.wrapItemInStateHandling(swaItem, () => this.refresh(swaItem));
    }

    async getTreeItem(element: TreeElementBase): Promise<vscode.TreeItem> {
        return await element.getTreeItem();
    }

    refresh(element?: TreeElementBase): void {
        this.onDidChangeTreeDataEmitter.fire(element);
    }
}
