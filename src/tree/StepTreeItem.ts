/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureTreeItem, TreeItemIconPath } from "vscode-azureextensionui";
import { ActionWorkflowStepData } from '../gitHubTypings';
import { getActionDescription, getActionIconPath } from '../utils/actionUtils';
import { IAzureResourceTreeItem } from './IAzureResourceTreeItem';
import { JobTreeItem } from './JobTreeItem';

export class StepTreeItem extends AzureTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'azureStaticStep';
    public readonly contextValue: string = StepTreeItem.contextValue;
    public parent: JobTreeItem;
    public data: ActionWorkflowStepData;

    constructor(parent: JobTreeItem, data: ActionWorkflowStepData) {
        super(parent);
        this.data = data;
    }

    public get iconPath(): TreeItemIconPath {
        return getActionIconPath(this.data);
    }

    public get id(): string {
        return this.data.number.toString();
    }

    public get name(): string {
        return this.data.name;
    }

    public get label(): string {
        return this.name;
    }

    public get description(): string {
        return getActionDescription(this.data);
    }
}
