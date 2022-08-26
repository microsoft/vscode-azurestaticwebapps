/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IAzureQuickPickItem, IAzureQuickPickOptions, IWizardOptions, nonNullValue, parseError } from '@microsoft/vscode-azext-utils';
import { TreeDataProvider } from 'vscode';
import { ApplicationResource, Filter, ResourceGroupsItem } from '../vscode-azureresourcegroups.api.v2';
import { QuickPickAppResourceWizardContext } from './QuickPickAppResourceWizardContext';
import { getLastNode } from './QuickPickWizardContext';
import { RecursiveQuickPickStep } from './RecursiveQuickPickStep';

export interface PickAppResourceOptions2 extends IAzureQuickPickOptions {
    /**
     * Set this to pick a child of the selected app resource
     */
    childFilter?: Filter<ResourceGroupsItem>;

    /**
     * Whether `AppResourceTreeItem`s should be resolved before displaying them as quick picks, or only once one has been selected
     * If a client extension needs to change label/description/something visible on the quick pick via `resolve`, set to true,
     * otherwise set to false. Default will be false.
     */
    resolveQuickPicksBeforeDisplay?: boolean;
}

export class QuickPickAppResourceStep<TModel extends ResourceGroupsItem> extends AzureWizardPromptStep<QuickPickAppResourceWizardContext<ResourceGroupsItem>> {
    public constructor(
        private readonly tdp: TreeDataProvider<ResourceGroupsItem>,
        private readonly filter?: Filter<ApplicationResource> | Filter<ApplicationResource>[],
        private readonly options?: PickAppResourceOptions2
    ) {
        super();
    }

    public override async prompt(wizardContext: QuickPickAppResourceWizardContext<ResourceGroupsItem>): Promise<void> {
        try {

            const lastNode = nonNullValue(getLastNode<ResourceGroupsItem>(wizardContext));

            const children = await this.tdp.getChildren(lastNode);


            wizardContext.pickedNodes.push();
        } catch (err) {
            // TODO: this is duplicated from `GenericQuickPickStep` which isn't ideal
            const error = parseError(err);
            if (error.errorType === 'GoBackError') {
                // Instead of wiping out a property value, which is the default wizard behavior for `GoBackError`, pop the most recent
                // value off from the provenance of the picks
                wizardContext.pickedNodes.pop();
            }

            // And rethrow
            throw err;
        }
    }

    public shouldPrompt(_wizardContext: QuickPickAppResourceWizardContext<TModel>): boolean {
        return true;
    }

    public async getSubWizard(wizardContext: QuickPickAppResourceWizardContext<TModel>): Promise<IWizardOptions<QuickPickAppResourceWizardContext<TModel>> | undefined> {
        if (this.options?.childFilter) {
            if (this.options.childFilter?.matches(nonNullValue(getLastNode<TModel>(wizardContext), 'lastNode'))) {
                return undefined;
            }

            return {
                hideStepCount: true,
                promptSteps: [
                    new RecursiveQuickPickStep(this.tdp, this.options.childFilter),
                ],
            };
        }

        return undefined;
    }

    private getQuickPickItem(resource: ApplicationResource): IAzureQuickPickItem<ApplicationResource> {
        return {
            label: resource.name,
            data: resource,
        };
    }

    private matchesAppResource(resource: ApplicationResource): boolean {
        if (!this.filter) {
            return true;
        }

        const filterArray = Array.isArray(this.filter) ? this.filter : [this.filter];
        return filterArray.some((filter) => filter.matches(resource));
    }
}
