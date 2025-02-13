/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementClient } from "@azure/arm-appservice";
import { GenericResourceExpanded, ResourceManagementClient } from "@azure/arm-resources";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStep } from "@microsoft/vscode-azext-utils";
import { Progress } from "vscode";
import { ext } from "../../extensionVariables";
import { createResourceClient, createWebSiteClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { StaticWebAppDeleteContext } from "./StaticWebAppDeleteContext";

export class StaticWebAppDeleteStep extends AzureWizardExecuteStep<StaticWebAppDeleteContext> {
    public priority: number = 100;

    public async execute(context: StaticWebAppDeleteContext, progress: Progress<{ message?: string; increment?: number }>): Promise<void> {
        progress.report({ message: localize('deletingSwa', 'Deleting static web app...') });

        const resourceClient: ResourceManagementClient = await createResourceClient(context);
        const resources: GenericResourceExpanded[] = await uiUtils.listAllIterator(resourceClient.resources.listByResourceGroup(context.staticWebApp.resourceGroup));

        const client: WebSiteManagementClient = await createWebSiteClient(context);
        await client.staticSites.beginDeleteStaticSiteAndWait(context.staticWebApp.resourceGroup, context.staticWebApp.name);

        const deleteSucceeded: string = localize('deleteSucceeded', 'Successfully deleted static web app "{0}".', context.staticWebApp.name);
        ext.outputChannel.appendLog(deleteSucceeded);

        // if there is only one resource in the resource group, delete it as well
        if (resources.length === 1) {
            context.resourceGroupToDelete = context.staticWebApp.resourceGroup;
        }
    }

    public shouldExecute(context: StaticWebAppDeleteContext): boolean {
        return !!context.staticWebApp;
    }
}
