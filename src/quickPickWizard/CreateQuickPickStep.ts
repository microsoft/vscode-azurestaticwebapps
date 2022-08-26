/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IAzureQuickPickItem } from '@microsoft/vscode-azext-utils';
import * as vscode from 'vscode';
import { localize } from '../utils/localize';
import { Filter, ResourceModelBase } from '../vscode-azureresourcegroups.api.v2';
import { GenericQuickPickStep } from './GenericQuickPickStep';
import { getLastNode, QuickPickWizardContext } from './QuickPickWizardContext';

type CreateCallback = () => vscode.ProviderResult<never>;

export class CreateQuickPickStep<TModel extends ResourceModelBase> extends GenericQuickPickStep<TModel> {
    public constructor(treeDataProvider: vscode.TreeDataProvider<TModel>, contextValueFilter: Filter<ResourceModelBase>, private readonly createCallback: CreateCallback) {
        super(treeDataProvider, contextValueFilter);
    }

    public override async prompt(wizardContext: QuickPickWizardContext<TModel>): Promise<void> {
        await super.prompt(wizardContext);

        const lastNode = getLastNode(wizardContext) as (TModel | CreateCallback);
        if (typeof lastNode === 'function') {
            // If the last node is a function, pop it off the list and execute it
            const callback = wizardContext.pickedNodes.pop() as unknown as CreateCallback;
            await callback();
        }
    }

    protected override async getPicks(wizardContext: QuickPickWizardContext<TModel>): Promise<IAzureQuickPickItem<TModel>[]> {
        const picks: IAzureQuickPickItem<TModel | CreateCallback>[] = await super.getPicks(wizardContext);
        picks.push(this.getCreatePick());
        return picks as IAzureQuickPickItem<TModel>[];
    }

    private getCreatePick(): IAzureQuickPickItem<CreateCallback> {
        return {
            label: localize('createQuickPickLabel', '$(add) Create...'),
            data: this.createCallback,
        };
    }
}
