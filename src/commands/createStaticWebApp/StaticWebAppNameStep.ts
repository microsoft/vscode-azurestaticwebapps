/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ResourceManagementClient, ResourceModels } from 'azure-arm-resource';
import { AzureNameStep, createAzureClient, IAzureNamingRules, ResourceGroupListStep, resourceGroupNamingRules } from "vscode-azureextensionui";
import { ext } from "../../extensionVariables";
import { StaticWebApp } from '../../tree/StaticWebAppTreeItem';
import { localize } from "../../utils/localize";
import { requestUtils } from "../../utils/requestUtils";
import { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";

export const staticWebAppNamingRules: IAzureNamingRules = {
    minLength: 1,
    maxLength: 40,
    // only accepts alphanumeric and "-"
    invalidCharsRegExp: /[^a-zA-Z0-9\-]/
};

export class StaticWebAppNameStep extends AzureNameStep<IStaticWebAppWizardContext> {
    public async prompt(wizardContext: IStaticWebAppWizardContext): Promise<void> {
        const namingRules: IAzureNamingRules[] = [resourceGroupNamingRules];
        namingRules.push(staticWebAppNamingRules);

        const prompt: string = localize('staticWebAppNamePrompt', 'Enter a name for the new static web app.');
        wizardContext.newStaticWebAppName = (await ext.ui.showInputBox({
            prompt,
            validateInput: async (value: string | undefined): Promise<string | undefined> => await this.validateStaticWebAppName(wizardContext, value)
        })).trim();
    }

    public shouldPrompt(wizardContext: IStaticWebAppWizardContext): boolean {
        return !wizardContext.newStaticWebAppName && !wizardContext.staticWebApp;
    }

    protected async isRelatedNameAvailable(wizardContext: IStaticWebAppWizardContext, name: string): Promise<boolean> {
        return await ResourceGroupListStep.isNameAvailable(wizardContext, name);
    }

    private async validateStaticWebAppName(wizardContext: IStaticWebAppWizardContext, name: string | undefined): Promise<string | undefined> {
        name = name ? name.trim() : '';

        if (name.length < staticWebAppNamingRules.minLength || name.length > staticWebAppNamingRules.maxLength) {
            return localize('invalidLength', 'The name must be between {0} and {1} characters.', staticWebAppNamingRules.minLength, staticWebAppNamingRules.maxLength);
        } else if (staticWebAppNamingRules.invalidCharsRegExp.test(name)) {
            return localize('invalidChars', 'The name can only contain alphanumeric characters and the symbol "-"');
        } else if (!await this.isNameAvailableInRg(wizardContext, name, name)) {
            return localize('nameAlreadyExists', 'Static web app name "{0}" already exists in resource group "{1}".', name, name);
        } else {
            return undefined;
        }
    }

    private async isNameAvailableInRg(wizardContext: IStaticWebAppWizardContext, rgName: string, name: string): Promise<boolean> {
        // Static Web app names must be unique to the current resource group.
        const client: ResourceManagementClient = createAzureClient(wizardContext, ResourceManagementClient);
        try {
            const rg: ResourceModels.ResourceGroup = await client.resourceGroups.get(rgName);
            const requestOptions: requestUtils.Request = await requestUtils.getDefaultAzureRequest(`${rg.id}/providers/Microsoft.Web/staticSites?api-version=2019-12-01-preview`, wizardContext);
            const swaInRg: StaticWebApp[] = (<{ value: StaticWebApp[] }>JSON.parse(await requestUtils.sendRequest(requestOptions))).value;
            if (swaInRg.find((swa: StaticWebApp) => swa.name === name)) {
                return false;
            }

        } catch (error) {
            // swallow error, it means this rg doesn't exist
        }
        return true;
    }
}
