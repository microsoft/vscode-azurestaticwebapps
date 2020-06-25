/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Progress } from "vscode";
import { AzureWizardExecuteStep } from "vscode-azureextensionui";
import { ext } from "../../extensionVariables";
import { StaticWebApp } from "../../tree/StaticWebAppTreeItem";
import { localize } from "../../utils/localize";
import { nonNullProp } from "../../utils/nonNull";
import { requestUtils } from "../../utils/requestUtils";
import { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";

export class StaticWebAppCreateStep extends AzureWizardExecuteStep<IStaticWebAppWizardContext> {
    public priority: number = 250;

    public async execute(wizardContext: IStaticWebAppWizardContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const newName: string = nonNullProp(wizardContext, 'newStaticWebAppName');
        const requestOptions: requestUtils.Request = await requestUtils.getDefaultAzureRequest(`${nonNullProp(wizardContext, 'resourceGroup').id}/providers/Microsoft.Web/staticSites/${newName}?api-version=2019-12-01-preview`, wizardContext, 'PUT');
        requestOptions.headers['Content-Type'] = 'application/json';
        // tslint:disable-next-line:no-any
        const requestBody: any = {};
        // tslint:disable: no-unsafe-any
        requestBody.location = wizardContext.location?.name;

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

        const creatingSwa: string = localize('creatingSwa', 'Creating new static web app "{0}"...', newName);
        progress.report({ message: creatingSwa });
        ext.outputChannel.appendLog(creatingSwa);
        wizardContext.staticWebApp = <StaticWebApp>JSON.parse(await requestUtils.sendRequest(requestOptions));
    }

    public shouldExecute(_wizardContext: IStaticWebAppWizardContext): boolean {
        return true;
    }
}
