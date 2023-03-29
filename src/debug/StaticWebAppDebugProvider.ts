/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra, callWithTelemetryAndErrorHandling, IActionContext } from "@microsoft/vscode-azext-utils";
import * as path from 'path';
import { CancellationToken, commands, debug, DebugConfiguration, DebugConfigurationProvider, MessageItem, Uri, WorkspaceFolder } from "vscode";
import { buildPresets } from "../buildPresets/buildPresets";
import { IBuildPreset } from '../buildPresets/IBuildPreset';
import { tryGetStaticWebAppsCliConfig } from "../cli/tryGetStaticWebAppsCliConfig";
import { validateSwaCliInstalled } from '../commands/cli/validateSwaCliInstalled';
import { tryGetApiLocations } from '../commands/createStaticWebApp/tryGetApiLocations';
import { emulatorAddress, funcAddress, pwaChrome, swaCliConfigFileName } from "../constants";
import { getFunctionsApi } from '../getExtensionApi';
import { detectAppFoldersInWorkspace } from "../utils/detectorUtils";
import { localize } from '../utils/localize';
import { getDebugConfigs } from "../vsCodeConfig/launch";

export class StaticWebAppDebugProvider implements DebugConfigurationProvider {

    private static readonly configPrefix: string = 'SWA: Run ';

    public async provideDebugConfigurations(folder: WorkspaceFolder): Promise<DebugConfiguration[]> {
        return await callWithTelemetryAndErrorHandling('staticWebApps.provideDebugConfigurations', async (context: IActionContext) => {
            const result: DebugConfiguration[] = [];

            const swaCliConfigFile = await tryGetStaticWebAppsCliConfig(folder.uri);
            if (swaCliConfigFile) {
                context.telemetry.measurements.configsCount = Object.entries(swaCliConfigFile?.configurations ?? []).length;
                result.push(...Object.entries(swaCliConfigFile?.configurations ?? []).map(([name, options]) => this.createDebugConfiguration(name, options.appLocation, swaCliConfigFileName)));
            }

            const appFolders = await detectAppFoldersInWorkspace(context, folder);
            context.telemetry.measurements.appCount = appFolders.length;
            const foundPresets: IBuildPreset[] = []
            appFolders.forEach((appFolder) => {
                const buildPreset = buildPresets.find((preset) => appFolder.frameworks.find((info) => info.framework === preset.displayName));

                if (buildPreset) {
                    foundPresets.push(buildPreset);
                    result.push(this.createDebugConfiguration(path.basename(appFolder.uri.fsPath), path.relative(folder.uri.fsPath, appFolder.uri.fsPath)));
                }
            });

            context.telemetry.properties.buildPresets = foundPresets.map((preset) => preset.id).join(', ');
            return result;
        }) ?? [];
    }

    public async resolveDebugConfiguration(folder: WorkspaceFolder | undefined, debugConfiguration: DebugConfiguration, cancellationToken: CancellationToken): Promise<DebugConfiguration | undefined> {
        return await callWithTelemetryAndErrorHandling('staticWebApps.resolveDebugConfiguration', async (context: IActionContext) => {
            context.telemetry.properties.isActivationEvent = 'true';
            context.errorHandling.suppressDisplay = true;
            context.telemetry.suppressIfSuccessful = true;

            if (this.isSwaDebugConfig(debugConfiguration)) {
                context.telemetry.properties.isActivationEvent = 'false';
                context.telemetry.suppressIfSuccessful = false;

                if (!folder) {
                    return undefined;
                }

                const hasSwaCli = await validateSwaCliInstalled(context, localize('installSwaCli', 'You must have the Azure Static Web Apps CLI installed to debug your static web app.'));
                if (!hasSwaCli) {
                    return undefined;
                }

                if ((await tryGetApiLocations(context, folder, true))?.length) {
                    context.telemetry.properties.hasApi = 'true';

                    // make sure Functions extension is installed
                    await getFunctionsApi(context, localize('funcInstallForDebugging', 'You must have the "Azure Functions" extension installed to debug a Functions API.'));

                    const configName = this.parseDebugConfigurationName(debugConfiguration);
                    const swaCliConfigFile = await tryGetStaticWebAppsCliConfig(folder.uri);
                    if (swaCliConfigFile) {
                        context.telemetry.properties.hasSwaCliConfigFile = 'true';
                    }

                    const config = swaCliConfigFile?.configurations?.[configName];
                    if (config && config.apiLocation !== funcAddress) {
                        const fixMi: MessageItem = { title: localize('fix', 'Fix') };
                        void context.ui.showWarningMessage(localize('funcApiDetected', "Did not start debugging Functions API because 'apiLocation' property is missing or invalid."), {
                            learnMoreLink: 'https://aka.ms/setupSwaCliCode'
                        }, fixMi).then(async (action) => {
                            if (action === fixMi) {
                                config.apiLocation = funcAddress;
                                await AzExtFsExtra.writeJSON(Uri.joinPath(folder.uri, swaCliConfigFileName).fsPath, swaCliConfigFile);
                            }
                        });
                    }

                    if (!cancellationToken.isCancellationRequested) {
                        context.telemetry.properties.debugApi = 'true';
                        await this.startDebuggingFunctions(folder);
                    }
                }
            }

            return debugConfiguration;
        });
    }

    private createDebugConfiguration(name: string, appLocation: string = '', postfix?: string): DebugConfiguration {
        return {
            name: `${StaticWebAppDebugProvider.configPrefix}${name}${postfix ? ` (${postfix})` : ''}`,
            request: 'launch',
            type: pwaChrome,
            url: emulatorAddress,
            preLaunchTask: `swa: start ${name}`,
            webRoot: `\${workspaceFolder}/${appLocation}`,
            // Ensure the debugger waits long enough for the emulator to start
            // See https://github.com/microsoft/vscode-azurestaticwebapps/issues/570
            timeout: 30000
        };
    }

    private async startDebuggingFunctions(folder: WorkspaceFolder): Promise<void> {
        let funcConfig = this.getFuncDebugConfig(folder);
        if (!funcConfig) {
            await commands.executeCommand('azureFunctions.initProjectForVSCode', folder.uri.fsPath);
            funcConfig = this.getFuncDebugConfig(folder);
        }

        if (funcConfig) {
            await debug.startDebugging(folder, funcConfig);
        }
    }

    private getFuncDebugConfig(folder: WorkspaceFolder): DebugConfiguration | undefined {
        const debugConfigurations = getDebugConfigs(folder);
        return debugConfigurations.find((debugConfig) => debugConfig.name.match(new RegExp(/^Attach to (.+) Functions$/, 'i')));
    }

    private parseDebugConfigurationName(debugConfiguration: DebugConfiguration): string {
        return debugConfiguration.name.substring(StaticWebAppDebugProvider.configPrefix.length);
    }

    private isSwaDebugConfig(debugConfiguration: DebugConfiguration): boolean {
        return !!(debugConfiguration?.name?.startsWith(StaticWebAppDebugProvider.configPrefix));
    }
}
