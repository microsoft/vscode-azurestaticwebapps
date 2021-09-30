/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { CancellationToken, DebugConfiguration, DebugConfigurationProvider, tasks, WorkspaceFolder } from "vscode";
import { callWithTelemetryAndErrorHandling, IActionContext } from "vscode-azureextensionui";
import { validateSwaCliInstalled } from '../commands/cli/validateSwaCliInstalled';
import { tryGetApiLocations } from '../commands/createStaticWebApp/tryGetApiLocations';
import { swaTaskLabel } from '../constants';
import { getFunctionsApi } from '../getExtensionApi';
import { localize } from '../utils/localize';
import { AzureFunctionsExtensionApi } from '../vscode-azurefunctions.api';

export class StaticWebAppDebugProvider implements DebugConfigurationProvider {
    public async provideDebugConfigurations(_folder?: WorkspaceFolder, _token?: CancellationToken): Promise<DebugConfiguration[]> {
        // Don't provide any debug configurations automatically for now
        return []
    }

    public async resolveDebugConfiguration(folder: WorkspaceFolder | undefined, debugConfiguration: DebugConfiguration, _token?: CancellationToken): Promise<DebugConfiguration | undefined> {
        return await callWithTelemetryAndErrorHandling('resolveSwaDebugConfiguration', async (context: IActionContext) => {
            if (debugConfiguration.preLaunchTask === swaTaskLabel) {
                if (!folder) {
                    return;
                }
                const hasSwaCli = await validateSwaCliInstalled(context, localize('installSwaCli', 'You must have the Azure Static Web Apps CLI installed to debug your static web app.'));
                if (!hasSwaCli) {
                    return undefined;
                }

                const apiLocations = await tryGetApiLocations(context, folder);
                const hasApi: boolean = !!apiLocations && apiLocations.length > 0;

                if (hasApi) {
                    // make sure functions core tools is installed
                    const funcApi: AzureFunctionsExtensionApi = await getFunctionsApi(context);
                    const message: string = localize('installFuncTools', 'You must have the Azure Functions Core Tools installed to debug your local functions.');
                    const hasCoreTools: boolean | undefined = await funcApi.validateFuncCoreToolsInstalled(message, folder.uri.fsPath);
                    if (!hasCoreTools) {
                        return undefined;
                    }
                }
            }
            return debugConfiguration;
        });
    }
}

export function terminateSwaTasks(): void {
    tasks.taskExecutions.filter((execution) => execution.task.name === swaTaskLabel).forEach(te => te.terminate());
}
