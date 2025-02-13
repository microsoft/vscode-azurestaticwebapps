/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ResourceManagementClient } from "@azure/arm-resources";
import { AzureWizardExecuteStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import { Progress } from "vscode";
import { createResourceClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { StaticWebAppDeleteContext } from "./StaticWebAppDeleteContext";

export class ResourceGroupDeleteStep extends AzureWizardExecuteStep<StaticWebAppDeleteContext> {
    public priority: number = 250;

    public async execute(context: StaticWebAppDeleteContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const resourceGroupName = nonNullProp(context, 'resourceGroupToDelete');
        const message = localize('deleteResourceGroup', 'Deleting resource group...');
        progress.report({ message });

        const resourceClient: ResourceManagementClient = await createResourceClient(context);
        await resourceClient.resourceGroups.beginDeleteAndWait(resourceGroupName);
    }

    public shouldExecute(context: StaticWebAppDeleteContext): boolean {
        return !!context.resourceGroupToDelete;
    }
}
