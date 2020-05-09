/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Progress } from "vscode";
import { AzureWizardExecuteStep } from "vscode-azureextensionui";
import { StaticWebApp } from "../../tree/StaticWebAppTreeItem";
import { getGitHubAccessToken } from "../../utils/gitHubUtils";
import { localize } from "../../utils/localize";
import { nonNullProp } from "../../utils/nonNull";
import { requestUtils } from "../../utils/requestUtils";
import { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";

export class StaticWebAppCreateStep extends AzureWizardExecuteStep<IStaticWebAppWizardContext> {
    public priority: number = 250;

    public async execute(wizardContext: IStaticWebAppWizardContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const requestOptions: requestUtils.Request = await requestUtils.getDefaultAzureRequest(`${nonNullProp(wizardContext, 'resourceGroup').id}/providers/Microsoft.Web/staticSites/${wizardContext.newStaticWebAppName}?api-version=2019-12-01-preview`, wizardContext, 'PUT');
        requestOptions.headers['Content-Type'] = 'application/json';
        // tslint:disable-next-line:no-any
        const requestBody: any = {};
        // tslint:disable: no-unsafe-any
        requestBody.location = wizardContext.location?.name;

        // get the token if we never did (this occurs when we auto-detect the remote)
        wizardContext.accessToken = wizardContext.accessToken ? wizardContext.accessToken : await getGitHubAccessToken();
        const properties: {} = {
            repositoryUrl: wizardContext.repoHtmlUrl,
            branch: wizardContext.branchData?.name,
            repositoryToken: wizardContext.accessToken,
            buildProperties: {
                appLocation: wizardContext.appLocation,
                apiLocation: wizardContext.apiLocation,
                appArtifactLocation: wizardContext.appArtifactLocation
            }
        };
        requestBody.properties = properties;

        const standard: string = 'Free';
        requestBody.sku = { Name: standard, Tier: standard };

        requestOptions.body = JSON.stringify(requestBody);
        progress.report({ message: localize('creatingStaticApp', 'Creating Static Web App "{0}"...', wizardContext.newStaticWebAppName) });
        wizardContext.staticWebApp = <StaticWebApp>JSON.parse(await requestUtils.sendRequest(requestOptions));
        progress.report({ message: localize('creatingStaticApp', 'Created Static Web App "{0}".', wizardContext.newStaticWebAppName) });
    }

    public shouldExecute(_wizardContext: IStaticWebAppWizardContext): boolean {
        return true;
    }
}
