/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementModels } from '@azure/arm-appservice';
import * as path from 'path';
import { AzureNameStep, IAzureNamingRules, ResourceGroupListStep, resourceGroupNamingRules } from "vscode-azureextensionui";
import { localize } from "../../utils/localize";
import { nonNullProp } from '../../utils/nonNull';
import { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";

export const staticWebAppNamingRules: IAzureNamingRules = {
    minLength: 1,
    maxLength: 40,
    // only accepts alphanumeric and "-"
    invalidCharsRegExp: /[^a-zA-Z0-9\-]/
};

let listOfSites: WebSiteManagementModels.StaticSitesListResponse | undefined;

export class StaticWebAppNameStep extends AzureNameStep<IStaticWebAppWizardContext> {
    public async prompt(context: IStaticWebAppWizardContext): Promise<void> {
        const folderName: string = path.basename(nonNullProp(context, 'fsPath'));

        const prompt: string = localize('staticWebAppNamePrompt', 'Enter a name for the new static web app.');
        context.newStaticWebAppName = (await context.ui.showInputBox({
            prompt,
            value: await this.getRelatedName(context, folderName),
            validateInput: async (value: string | undefined): Promise<string | undefined> => await this.validateStaticWebAppName(context, value)
        })).trim();

        context.valuesToMask.push(context.newStaticWebAppName);
        context.relatedNameTask = this.getRelatedName(context, context.newStaticWebAppName);
    }

    public shouldPrompt(context: IStaticWebAppWizardContext): boolean {
        return !context.newStaticWebAppName;
    }

    protected async isRelatedNameAvailable(context: IStaticWebAppWizardContext, name: string): Promise<boolean> {
        if (!context.newStaticWebAppName) {
            return await this.isSwaNameAvailable(context, name);
        }

        // if we already have a swa name, then we're checking for resource group name
        return await ResourceGroupListStep.isNameAvailable(context, name);
    }

    public async getRelatedName(context: IStaticWebAppWizardContext, name: string): Promise<string | undefined> {
        return await this.generateRelatedName(context, name, [staticWebAppNamingRules, resourceGroupNamingRules]);
    }

    private async validateStaticWebAppName(context: IStaticWebAppWizardContext, name: string | undefined): Promise<string | undefined> {
        name = name ? name.trim() : '';
        if (name.length < staticWebAppNamingRules.minLength || name.length > staticWebAppNamingRules.maxLength) {
            return localize('invalidLength', 'The name must be between {0} and {1} characters.', staticWebAppNamingRules.minLength, staticWebAppNamingRules.maxLength);
        } else if (staticWebAppNamingRules.invalidCharsRegExp.test(name)) {
            return localize('invalidChars', 'The name can only contain alphanumeric characters and the symbol "-"');
        } else if (!await this.isSwaNameAvailable(context, name)) {
            return localize('nameAlreadyExists', 'Static web app name "{0}" already exists in your subscription.', name, name);
        } else {
            return undefined;
        }
    }

    private async isSwaNameAvailable(context: IStaticWebAppWizardContext, resourceName: string): Promise<boolean> {
        // Our implementation is that Static Web app names must be unique to the subscription.
        listOfSites = listOfSites || await context.client.staticSites.list();
        return !listOfSites.some(ss => {
            return ss.name === resourceName;
        });

    }
}
