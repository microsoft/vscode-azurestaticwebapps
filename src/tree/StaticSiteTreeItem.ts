/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureParentTreeItem, AzureTreeItem, TreeItemIconPath } from "vscode-azureextensionui";
import { requestUtils } from "../utils/requestUtils";
import { treeUtils } from "../utils/treeUtils";

export type StaticSite = {
    id: string;
    location: string;
    name: string;
    properties: {
        defaultHostname: string;
        repositoryUrl: string;
        branch: string;
        customDomains: string[];
    };
    sku: {
        name: string;
        tier: string;
    };
    // tslint:disable-next-line:no-reserved-keywords
    type: string;
};

export class StaticSiteTreeItem extends AzureTreeItem {
    public static contextValue: string = 'azureStaticSite';
    public readonly contextValue: string = StaticSiteTreeItem.contextValue;
    public readonly data: StaticSite;

    constructor(parent: AzureParentTreeItem, ss: StaticSite) {
        super(parent);
        this.data = ss;
    }

    public get name(): string {
        return this.data.name;
    }

    public get id(): string {
        return this.data.id;
    }

    public get label(): string {
        return this.data.name;
    }

    public get description(): string | undefined {
        return this.data.properties.defaultHostname;
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getIconPath('resourceGroup');
    }

    public async deleteTreeItemImpl(): Promise<void> {
        const requestOptions: requestUtils.Request = await requestUtils.getDefaultAzureRequest(`${this.id}/providers/Microsoft.Web/staticSites?api-version=2019-12-01-preview`, this.root, 'DELETE');
        return await requestUtils.sendRequest(requestOptions);
    }
}
