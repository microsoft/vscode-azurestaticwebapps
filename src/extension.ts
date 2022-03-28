/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { registerAppServiceExtensionVariables } from '@microsoft/vscode-azext-azureappservice';
import { registerAzureUtilsExtensionVariables } from '@microsoft/vscode-azext-azureutils';
import { callWithTelemetryAndErrorHandling, createApiProvider, createAzExtOutputChannel, createExperimentationService, IActionContext, registerUIExtensionVariables } from '@microsoft/vscode-azext-utils';
import { AzureExtensionApi, AzureExtensionApiProvider } from '@microsoft/vscode-azext-utils/api';
import * as vscode from 'vscode';
import { AzureResourceGroupsExtensionApi } from './api';
import { SwaTaskProvider } from './cli/SwaCliTaskProvider';
import { revealTreeItem } from './commands/api/revealTreeItem';
import { registerSwaCliTaskEvents } from './commands/cli/swaCliTask';
import { validateStaticWebAppsCliIsLatest } from './commands/cli/validateSwaCliIsLatest';
import { contentScheme } from './commands/github/jobLogs/GitHubLogContentProvider';
import GitHubLogFoldingProvider from './commands/github/jobLogs/GitHubLogFoldingProvider';
import { registerCommands } from './commands/registerCommands';
import { githubAuthProviderId, githubScopes, pwaChrome, shell, swa } from './constants';
import { StaticWebAppDebugProvider } from './debug/StaticWebAppDebugProvider';
import { ext } from './extensionVariables';
import { getApiExport } from './getExtensionApi';
import { StaticWebAppResolver } from './StaticWebAppResolver';

export async function activateInternal(context: vscode.ExtensionContext, perfStats: { loadStartTime: number; loadEndTime: number }, ignoreBundle?: boolean): Promise<AzureExtensionApiProvider> {
    ext.context = context;
    ext.ignoreBundle = ignoreBundle;
    ext.outputChannel = createAzExtOutputChannel('Azure Static Web Apps', ext.prefix);
    context.subscriptions.push(ext.outputChannel);

    registerUIExtensionVariables(ext);
    registerAzureUtilsExtensionVariables(ext);
    registerAppServiceExtensionVariables(ext);

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

        const rgApiProvider = await getApiExport<AzureExtensionApiProvider>('ms-azuretools.vscode-azureresourcegroups');
        if (rgApiProvider) {
            const api = rgApiProvider.getApi<AzureResourceGroupsExtensionApi>('0.0.1');
            ext.rgApi = api;
            api.registerApplicationResourceResolver('Microsoft.Web/staticSites', new StaticWebAppResolver());
        } else {
            throw new Error('Could not find the Azure Resource Groups extension');
        }

        registerSwaCliTaskEvents();

        registerCommands();

        ext.experimentationService = await createExperimentationService(context);
    });

    return createApiProvider([<AzureExtensionApi>{
        revealTreeItem,
        apiVersion: '1.0.0'
    }]);
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivateInternal(): void {
}
