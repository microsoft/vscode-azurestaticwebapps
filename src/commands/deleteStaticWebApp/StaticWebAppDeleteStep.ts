/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementClient } from "@azure/arm-appservice";
import { GenericResourceExpanded, ResourceManagementClient } from "@azure/arm-resources";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import { Progress } from "vscode";
import { createResourceClient, createWebSiteClient } from "../../utils/azureClients";
import { pollAzureAsyncOperation } from "../../utils/azureUtils";
import { localize } from "../../utils/localize";
import { IDeleteWizardContext } from "./IDeleteWizardContext";

export class StaticWebAppDeleteStep extends AzureWizardExecuteStep<IDeleteWizardContext> {
    public priority: number = 100;

    public async execute(context: IDeleteWizardContext, progress: Progress<{ message?: string; increment?: number }>): Promise<void> {

        const swaNode = nonNullProp(context, 'node');

        const message = localize('deleteSwa', 'Deleting static web app "{0}"...', swaNode.name);
        progress.report({ message });

        const resourceClient: ResourceManagementClient = await createResourceClient([context, context.subscription]);
        const resources: GenericResourceExpanded[] = await uiUtils.listAllIterator(resourceClient.resources.listByResourceGroup(swaNode.resourceGroup));

        const client: WebSiteManagementClient = await createWebSiteClient([context, context.subscription]);
        // the client API call only awaits the call, but doesn't poll for the result so we handle that ourself
        const deleteResponse = await client.staticSites.deleteStaticSite(swaNode.resourceGroup, swaNode.name);
        await pollAzureAsyncOperation(context, deleteResponse, context.subscription);

        // if there is only one resource in the resource group, delete it as well
        if (resources.length === 1) {
            context.resourceGroupToDelete = swaNode.resourceGroup;
        }
    }

    public shouldExecute(_wizardContext: IDeleteWizardContext): boolean {
        return true;
    }
}
