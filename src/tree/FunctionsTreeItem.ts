/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtTreeItem, AzureParentTreeItem, GenericTreeItem, IActionContext, TreeItemIconPath } from "vscode-azureextensionui";
import { localize } from '../utils/localize';
import { requestUtils } from "../utils/requestUtils";
import { treeUtils } from "../utils/treeUtils";
import { EnvironmentTreeItem } from "./EnvironmentTreeItem";
import { FunctionTreeItem } from "./FunctionTreeItem";

export class FunctionsTreeItem extends AzureParentTreeItem {

    public static contextValue: string = 'azureStaticFunctions';
    public readonly contextValue: string = FunctionsTreeItem.contextValue;

    constructor(parent: EnvironmentTreeItem) {
        super(parent);
    }

    public get id(): string {
        return 'functionsList';
    }

    public get label(): string {
        return 'Functions';
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getThemedIconPath('list-unordered');
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, _context: IActionContext): Promise<AzExtTreeItem[]> {
        const requestOptions: requestUtils.Request = await requestUtils.getDefaultAzureRequest(`${this.parent?.id}/functions?api-version=2019-12-01-preview`, this.root);
        const functions: { value: { id: string; name: string }[] } = <{ value: { id: string; name: string }[] }>JSON.parse(await requestUtils.sendRequest(requestOptions));
        const treeItems: AzExtTreeItem[] = await this.createTreeItemsWithErrorHandling(
            functions.value,
            'invalidFunction',
            func => new FunctionTreeItem(this, func),
            func => func.name);

        if (treeItems.length === 0) {
            return [new GenericTreeItem(this, { label: localize('noFunctions', 'No Functions have been pushed to this Static Web App.'), contextValue: 'noFunctions' })];
        } else {
            return treeItems;
        }
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }
}
