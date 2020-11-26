/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureNameStep, IAzureNamingRules } from "vscode-azureextensionui";
import { ext } from "../../extensionVariables";
import { getRepoFullname } from "../../utils/gitHubUtils";
import { localize } from "../../utils/localize";
import { nonNullProp } from "../../utils/nonNull";
import { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";

export const staticWebAppNamingRules: IAzureNamingRules = {
    minLength: 1,
    maxLength: 40,
    // only accepts alphanumeric and "-"
    invalidCharsRegExp: /[^a-zA-Z0-9\-]/
};

export class StaticWebAppNameStep extends AzureNameStep<IStaticWebAppWizardContext> {
    public async prompt(wizardContext: IStaticWebAppWizardContext): Promise<void> {

        const login: string = wizardContext.orgData?.login || getRepoFullname(nonNullProp(wizardContext, 'repoHtmlUrl')).owner;
        const repo: string = wizardContext.newRepoName || wizardContext.repoData?.name || getRepoFullname(nonNullProp(wizardContext, 'repoHtmlUrl')).name;

        const prompt: string = localize('staticWebAppNamePrompt', 'Enter a name for the new static web app.');
        wizardContext.newStaticWebAppName = (await ext.ui.showInputBox({
            prompt,
            value: await this.getRelatedName(wizardContext, `${login}-${repo}`),
            validateInput: async (value: string | undefined): Promise<string | undefined> => await this.validateStaticWebAppName(wizardContext, value)
        })).trim();
    }

    public shouldPrompt(wizardContext: IStaticWebAppWizardContext): boolean {
        return !wizardContext.newStaticWebAppName;
    }

    public async isRelatedNameAvailable(wizardContext: IStaticWebAppWizardContext, name: string): Promise<boolean> {
        return await this.isSwaNameAvailable(wizardContext, name);
    }

    public async getRelatedName(wizardContext: IStaticWebAppWizardContext, name: string): Promise<string | undefined> {
        return await this.generateRelatedName(wizardContext, name, staticWebAppNamingRules);
    }

    private async validateStaticWebAppName(wizardContext: IStaticWebAppWizardContext, name: string | undefined): Promise<string | undefined> {
        name = name ? name.trim() : '';

        if (name.length < staticWebAppNamingRules.minLength || name.length > staticWebAppNamingRules.maxLength) {
            return localize('invalidLength', 'The name must be between {0} and {1} characters.', staticWebAppNamingRules.minLength, staticWebAppNamingRules.maxLength);
        } else if (staticWebAppNamingRules.invalidCharsRegExp.test(name)) {
            return localize('invalidChars', 'The name can only contain alphanumeric characters and the symbol "-"');
        } else if (!await this.isSwaNameAvailable(wizardContext, name)) {
            return localize('nameAlreadyExists', 'Static web app name "{0}" already exists in your subscription.', name, name);
        } else {
            return undefined;
        }
    }

    private async isSwaNameAvailable(wizardContext: IStaticWebAppWizardContext, resourceName: string): Promise<boolean> {
        // Static Web app names must be unique to the current resource group.
        try {
            await wizardContext.client.staticSites.getStaticSite(resourceName, resourceName);
            return false;

        } catch (error) {
            // if an error is thrown, it means the SWA name is available
            return true;
        }
    }
}
