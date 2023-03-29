/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { registerAzureUtilsExtensionVariables } from '@microsoft/vscode-azext-azureutils';
import { callWithTelemetryAndErrorHandling, createAzExtOutputChannel, createExperimentationService, IActionContext, registerUIExtensionVariables } from '@microsoft/vscode-azext-utils';
import { apiUtils, AzExtResourceType } from "@microsoft/vscode-azureresources-api";
import * as vscode from 'vscode';
import { SwaTaskProvider } from './cli/SwaCliTaskProvider';
import { registerSwaCliTaskEvents } from './commands/cli/swaCliTask';
import { validateStaticWebAppsCliIsLatest } from './commands/cli/validateSwaCliIsLatest';
import { contentScheme } from './commands/github/jobLogs/GitHubLogContentProvider';
import GitHubLogFoldingProvider from './commands/github/jobLogs/GitHubLogFoldingProvider';
import { registerCommands } from './commands/registerCommands';
import { githubAuthProviderId, githubScopes, pwaChrome, shell, swa } from './constants';
import { StaticWebAppDebugProvider } from './debug/StaticWebAppDebugProvider';
import { ext } from './extensionVariables';
import { getResourceGroupsApi } from './getExtensionApi';
import { RemoteRepoApi } from './RemoteRepoApi';
import { StaticWebAppResolver } from './StaticWebAppResolver';

export async function activate(context: vscode.ExtensionContext, perfStats: { loadStartTime: number; loadEndTime: number }, ignoreBundle?: boolean): Promise<apiUtils.AzureExtensionApiProvider> {
    // the entry point for vscode.dev is this activate, not main.js, so we need to instantiate perfStats here
    // the perf stats don't matter for vscode because there is no main file to load-- we may need to see if we can track the download time
    perfStats ||= { loadStartTime: Date.now(), loadEndTime: Date.now() };

    ext.context = context;
    ext.ignoreBundle = ignoreBundle;
    ext.outputChannel = createAzExtOutputChannel('Azure Static Web Apps', ext.prefix);
    context.subscriptions.push(ext.outputChannel);

    registerUIExtensionVariables(ext);
    registerAzureUtilsExtensionVariables(ext);

    await callWithTelemetryAndErrorHandling('staticWebApps.activate', async (activateContext: IActionContext) => {
        activateContext.telemetry.properties.isActivationEvent = 'true';
        activateContext.telemetry.measurements.mainFileLoad = (perfStats.loadEndTime - perfStats.loadStartTime) / 1000;
        void validateStaticWebAppsCliIsLatest();

        /**
         * By passing `createIfNone: false`, a numbered badge will show up on the accounts activity bar icon.
         * An entry for the extension will be added under the menu to sign in.
         */
        await vscode.authentication.getSession(githubAuthProviderId, githubScopes, { createIfNone: false });

        context.subscriptions.push(vscode.languages.registerFoldingRangeProvider({ scheme: contentScheme }, new GitHubLogFoldingProvider()));
        context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider(pwaChrome, new StaticWebAppDebugProvider()));
        context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider(swa, new StaticWebAppDebugProvider(), vscode.DebugConfigurationProviderTriggerKind.Dynamic));
        context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider(swa, new StaticWebAppDebugProvider(), vscode.DebugConfigurationProviderTriggerKind.Initial));
        context.subscriptions.push(vscode.tasks.registerTaskProvider(shell, new SwaTaskProvider()));

        ext.rgApi = await getResourceGroupsApi();
        ext.rgApi.registerApplicationResourceResolver(AzExtResourceType.StaticWebApps, new StaticWebAppResolver());

        ext.remoteRepoApi = new RemoteRepoApi();
        registerSwaCliTaskEvents();
        registerCommands();

        ext.experimentationService = await createExperimentationService(context);
    });

    // remoteRepoApi is combined with the SWA API required for resource gropus, but the remote repo relies on extension exports
    return ext.remoteRepoApi;
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate(): void {
}
