/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ResourceManagementClient } from "@azure/arm-resources";
import { AzureWizardExecuteStep } from "@microsoft/vscode-azext-utils";
import { Progress } from "vscode";
import { createResourceClient } from "../../utils/azureClients";
import { IDeleteWizardContext } from "./IDeleteWizardContext";

export class DeleteResourceGroupStep extends AzureWizardExecuteStep<IDeleteWizardContext> {
    public priority: number = 250;

    public async execute(context: IDeleteWizardContext, _progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const resourceClient: ResourceManagementClient = await createResourceClient([context, this._subscription]);
        await resourceClient.resourceGroups.beginDeleteAndWait(this.resourceGroup);
    }

    public shouldExecute(context: IDeleteWizardContext): boolean {
        return !!context.resourceGroupNameToDelete;
    }
}
