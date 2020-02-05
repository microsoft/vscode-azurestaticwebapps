/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ResourceManagementClient, ResourceModels } from "azure-arm-resource";
import { AzExtTreeItem, AzureParentTreeItem, createAzureClient, TreeItemIconPath } from "vscode-azureextensionui";
import { localize } from "../utils/localize";
import { nonNullProp } from "../utils/nonNull";
import { treeUtils } from "../utils/treeUtils";
import { ResourceTreeItem } from "./ResourceTreeItem";

export class ResourceGroupTreeItem extends AzureParentTreeItem {
    public static contextValue: string = 'azureResourceGroup';
    public readonly contextValue: string = ResourceGroupTreeItem.contextValue;
    public readonly childTypeLabel: string = localize('resource', 'Resource');
    public data: ResourceModels.ResourceGroup;

    private _nextLink: string | undefined;

    constructor(parent: AzureParentTreeItem, rg: ResourceModels.ResourceGroup) {
        super(parent);
        this.data = rg;
    }

    public get name(): string {
        return nonNullProp(this.data, 'name');
    }

    public get id(): string {
        return nonNullProp(this.data, 'id');
    }

    public get label(): string {
        return this.name;
    }

    public get description(): string | undefined {
        const state: string | undefined = this.data.properties?.provisioningState;
        return state?.toLowerCase() === 'succeeded' ? undefined : state;
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getIconPath('resourceGroup');
    }

    public hasMoreChildrenImpl(): boolean {
        return !!this._nextLink;
    }

    public async loadMoreChildrenImpl(clearCache: boolean): Promise<AzExtTreeItem[]> {
        if (clearCache) {
            this._nextLink = undefined;
        }

        const client: ResourceManagementClient = createAzureClient(this.root, ResourceManagementClient);
        const resources: ResourceModels.ResourceListResult = this._nextLink ? await client.resources.listByResourceGroupNext(this._nextLink) : await client.resources.listByResourceGroup(this.name);
        this._nextLink = resources.nextLink;
        return await this.createTreeItemsWithErrorHandling(
            resources,
            'invalidResource',
            resource => new ResourceTreeItem(this, resource),
            resource => resource.name
        );
    }

    public async refreshImpl(): Promise<void> {
        const client: ResourceManagementClient = createAzureClient(this.root, ResourceManagementClient);
        this.data = await client.resourceGroups.get(this.name);
    }

    public async deleteTreeItemImpl(): Promise<void> {
        const client: ResourceManagementClient = createAzureClient(this.root, ResourceManagementClient);
        await client.resourceGroups.deleteMethod(this.name);
    }
}
