/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ResourceManagementClient } from "@azure/arm-resources";
import { AzureWizardExecuteStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import { Progress } from "vscode";
import { createResourceClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { IDeleteWizardContext } from "./IDeleteWizardContext";

export class DeleteResourceGroupStep extends AzureWizardExecuteStep<IDeleteWizardContext> {
    public priority: number = 250;

    public async execute(context: IDeleteWizardContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const resourceGroupName = nonNullProp(context, 'resourceGroupToDelete');
        const message = localize('deleteResourceGroup', 'Deleting resource group "{0}"...', resourceGroupName);
        progress.report({ message });
        const resourceClient: ResourceManagementClient = await createResourceClient([context, context.subscription]);
        await resourceClient.resourceGroups.beginDeleteAndWait(resourceGroupName);
    }

    public shouldExecute(context: IDeleteWizardContext): boolean {
        return !!context.resourceGroupToDelete;
    }
}
