/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementClient } from "@azure/arm-appservice";
import { AzureWizardExecuteStep, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import { Progress } from "vscode";
import { ext } from "../../extensionVariables";
import { createWebSiteClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { EnvironmentDeleteContext } from "./EnvironmentDeleteContext";

export class EnvironmentDeleteStep extends AzureWizardExecuteStep<EnvironmentDeleteContext> {
    public priority: number = 100;

    public async execute(context: EnvironmentDeleteContext, progress: Progress<{ message?: string; increment?: number }>): Promise<void> {
        progress.report({ message: localize('deletingEnvironment', 'Deleting environment...') });

        const appName: string = nonNullValueAndProp(context.staticWebApp, 'name');
        const buildId: string = nonNullValueAndProp(context.staticSiteBuild, 'buildId');
        const resourceGroupName: string = nonNullValueAndProp(context.staticWebApp, 'resourceGroup');

        const client: WebSiteManagementClient = await createWebSiteClient(context);
        await client.staticSites.beginDeleteStaticSiteBuildAndWait(resourceGroupName, appName, buildId);

        const deleteSucceeded: string = localize('deleteSucceeded', 'Successfully deleted environment "{0}".', context.environmentName);
        ext.outputChannel.appendLog(deleteSucceeded);

        ext.state.notifyChildrenChanged(nonNullValueAndProp(context.staticWebApp, 'id'));
    }

    public shouldExecute(context: EnvironmentDeleteContext): boolean {
        return !!context.staticSiteBuild;
    }
}
