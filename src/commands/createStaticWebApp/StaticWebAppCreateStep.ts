/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementClient, type StaticSiteARMResource } from "@azure/arm-appservice";
import { DefaultAzureCredential } from "@azure/identity";
import { LocationListStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStep, nonNullProp, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import type { AppResource } from "@microsoft/vscode-azext-utils/hostapi";
import type { Octokit } from "@octokit/rest";
import type { Progress } from "vscode";
import { ext } from "../../extensionVariables";
import { localize } from "../../utils/localize";
import { createOctokitClient } from "../github/createOctokitClient";
import type { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";

const branch_owner = "alain-zhiyanov";
export class StaticWebAppCreateStep extends AzureWizardExecuteStep<IStaticWebAppWizardContext> {
    public priority = 250;
    public async execute(context: IStaticWebAppWizardContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        if(context.logicApp) {
            //There was an issue where some fields of context would be lost when SWA called with LA. This is a temporary fix to find the branch data again here because of that. Note this will only work with alain github.
            const octokitClient: Octokit = await createOctokitClient(context);
            const repo = context.newStaticWebAppName || 'def';
            const { data } = await octokitClient.repos.get({ owner: branch_owner, repo });
            context.repoHtmlUrl = data.html_url;
            const { data: branches } = await octokitClient.repos.listBranches({
                owner: branch_owner,
                repo
            });
            const defaultBranch = branches.find(branch => branch.name === 'main');
            if (defaultBranch) {
                context.branchData = { name: defaultBranch.name };
            } else {
                context.branchData = {name: branches[0].name };
            }
        }

        //api call to ARM
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

        if (context.logicApp) {
            //link backends only if SWA called with LA
            const staticSiteLinkedBackendEnvelope = {
                backendResourceId: context.logicApp.backendResourceId,
                region: context.logicApp.region
            };
            const credential = new DefaultAzureCredential();
            const client = new WebSiteManagementClient(credential, context.subscriptionId);

            try{
            const result = await client.staticSites.beginLinkBackendAndWait(
                nonNullValueAndProp(context.resourceGroup, 'name'), nonNullValueAndProp(context.staticWebApp, "name"), context.logicApp.name, staticSiteLinkedBackendEnvelope);
            console.log(result);
            } catch(error) {
                console.log(error);
            }
        }
    }

    public shouldExecute(_wizardContext: IStaticWebAppWizardContext): boolean {
        return true;
    }

}
