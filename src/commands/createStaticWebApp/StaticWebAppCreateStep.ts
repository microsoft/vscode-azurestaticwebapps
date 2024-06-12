/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { StaticSiteARMResource } from "@azure/arm-appservice";
import { LocationListStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStep, nonNullProp, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import { AppResource } from "@microsoft/vscode-azext-utils/hostapi";
import { Octokit } from "@octokit/rest";
import { Progress } from "vscode";
import { ext } from "../../extensionVariables";
import { localize } from "../../utils/localize";
import { createOctokitClient } from "../github/createOctokitClient";
import { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";

export class StaticWebAppCreateStep extends AzureWizardExecuteStep<IStaticWebAppWizardContext> {
    public priority: number = 250;

    public async execute(context: IStaticWebAppWizardContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        context.branchData = {name : "main"};

        const octokitClient: Octokit = await createOctokitClient(context);

        const owner = "alain-zhiyanov";
        const repo = context.newStaticWebAppName || 'def';

        const { data } = await octokitClient.repos.get({ owner, repo });
        context.repoHtmlUrl = data.html_url;

        const newName: string = nonNullProp(context, 'newStaticWebAppName');
        const branchData = nonNullProp(context, 'branchData');
        const siteEnvelope: StaticSiteARMResource = {
            repositoryUrl: context.repoHtmlUrl,
            branch: branchData.name,
            repositoryToken: context.accessToken,
            // The SDK hasn't updated to reflect the outputLocation property and platform will continue supporting appArtifactLocation, but will update as soon as available
            buildProperties: {
                appLocation: context.appLocation,
                apiLocation: context.apiLocation,
                appArtifactLocation: context.outputLocation
            },
            sku: context.sku,
            location: (await LocationListStep.getLocation(context)).name
        };

        const creatingSwa: string = localize('creatingSwa', 'Creating new static web app "{0}"...', newName);
        progress.report({ message: creatingSwa });
        ext.outputChannel.appendLog(creatingSwa);
        context.staticWebApp = await context.client.staticSites.beginCreateOrUpdateStaticSiteAndWait(nonNullValueAndProp(context.resourceGroup, 'name'), newName, siteEnvelope);
        context.activityResult = context.staticWebApp as AppResource;
    }

    public shouldExecute(_wizardContext: IStaticWebAppWizardContext): boolean {
        return true;
    }
}
