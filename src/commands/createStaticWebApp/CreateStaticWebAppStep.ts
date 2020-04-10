/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Progress } from "vscode";
import { AzureWizardExecuteStep } from "vscode-azureextensionui";
import { getGitHubAccessToken } from "../../github/connectToGitHub";
import { StaticSite } from "../../tree/StaticSiteTreeItem";
import { localize } from "../../utils/localize";
import { nonNullProp } from "../../utils/nonNull";
import { requestUtils } from "../../utils/requestUtils";
import { IStaticSiteWizardContext } from "./IStaticSiteWizardContext";

export class CreateStaticWebAppStep extends AzureWizardExecuteStep<IStaticSiteWizardContext> {
    public priority: number = 250;

    public async execute(wizardContext: IStaticSiteWizardContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const requestOptions: requestUtils.Request = await requestUtils.getDefaultAzureRequest(`${nonNullProp(wizardContext, 'resourceGroup').id}/providers/Microsoft.Web/staticSites/${wizardContext.newSiteName}?api-version=2019-12-01-preview`, wizardContext, 'PUT');
        requestOptions.headers['Content-Type'] = 'application/json';
        // tslint:disable-next-line:no-any
        const requestBody: any = {};
        // tslint:disable: no-unsafe-any
        requestBody.location = wizardContext.location?.name;

        // get the token if we never did
        wizardContext.accessToken = wizardContext.accessToken ? wizardContext.accessToken : await getGitHubAccessToken();
        const properties: {} = {
            repositoryUrl: wizardContext.repoData?.html_url,
            branch: wizardContext.branchData?.name,
            repositoryToken: wizardContext.accessToken,
            buildProperties: {
                appLocation: wizardContext.appLocation,
                apiLocation: wizardContext.apiLocation,
                appArtifactLocation: wizardContext.appArtifactLocation
            }
        };
        requestBody.properties = properties;

        const standard: string = 'Standard';
        requestBody.sku = { Name: standard, Tier: standard };

        requestOptions.body = JSON.stringify(requestBody);
        progress.report({ message: localize('creatingStaticApp', 'Creating Static Web App "{0}"...', wizardContext.newSiteName) });
        wizardContext.site = <StaticSite>JSON.parse(await requestUtils.sendRequest(requestOptions));
        progress.report({ message: localize('creatingStaticApp', 'Created Static Web App "{0}".', wizardContext.newSiteName) });
    }

    public shouldExecute(_wizardContext: IStaticSiteWizardContext): boolean {
        return true;
    }
}
