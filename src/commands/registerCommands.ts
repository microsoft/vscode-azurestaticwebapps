/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { commands } from 'vscode';
import { AppSettingsTreeItem, AppSettingTreeItem } from 'vscode-azureappservice';
import { AzExtParentTreeItem, AzExtTreeItem, IActionContext, registerCommand, registerErrorHandler, registerReportIssueCommand } from 'vscode-azureextensionui';
import { ext } from '../extensionVariables';
import { openUrl } from '../utils/openUrl';
import { downloadAppSettings } from './appSettings/downloadAppSettings';
import { editAppSetting } from './appSettings/editAppSetting';
import { renameAppSetting } from './appSettings/renameAppSetting';
import { uploadAppSettings } from './appSettings/uploadAppSettings';
import { browse } from './browse';
import { createChildNode } from './createChildNode';
import { createHttpFunction } from './createHttpFunction';
import { createStaticWebApp, createStaticWebAppAdvanced } from './createStaticWebApp/createStaticWebApp';
import { createSwaConfigFile } from './createSwaConfigFile';
import { deleteEnvironment } from './deleteEnvironment';
import { deleteNode } from './deleteNode';
import { deleteStaticWebApp } from './deleteStaticWebApp';
import { cancelAction, rerunAction } from './github/actionCommands';
import { cloneRepo } from './github/cloneRepo';
import { openGitHubLog } from './github/jobLogs/openGitHubLog';
import { openGitHubRepo } from './github/openGitHubRepo';
import { showActions } from './github/showActions';
import { openInPortal } from './openInPortal';
import { openYAMLConfigFile } from './openYAMLConfigFile';
import { viewProperties } from './viewProperties';

export function registerCommands(): void {
    registerCommand('staticWebApps.createStaticWebApp', createStaticWebApp);
    registerCommand('staticWebApps.createStaticWebAppAdvanced', createStaticWebAppAdvanced);
    registerCommand('staticWebApps.deleteStaticWebApp', deleteStaticWebApp);
    registerCommand('staticWebApps.deleteEnvironment', deleteEnvironment);
    registerCommand('staticWebApps.loadMore', async (context: IActionContext, node: AzExtTreeItem) => await ext.tree.loadMore(node, context));
    registerCommand('staticWebApps.openInPortal', openInPortal);
    registerCommand('staticWebApps.refresh', async (context: IActionContext, node?: AzExtTreeItem) => await ext.tree.refresh(context, node));
    registerCommand('staticWebApps.selectSubscriptions', () => commands.executeCommand('azure-account.selectSubscriptions'));
    registerCommand('staticWebApps.viewProperties', viewProperties);
    registerCommand('staticWebApps.createHttpFunction', createHttpFunction);
    registerCommand('staticWebApps.browse', browse);
    registerCommand('staticWebApps.showActions', showActions);
    registerCommand('staticWebApps.action.rerun', rerunAction);
    registerCommand('staticWebApps.action.cancel', cancelAction);
    registerCommand('staticWebApps.cloneRepo', cloneRepo);
    registerCommand('staticWebApps.openGitHubRepo', openGitHubRepo);
    registerCommand('staticWebApps.appSettings.add', async (context: IActionContext, node?: AzExtParentTreeItem) => await createChildNode(context, AppSettingsTreeItem.contextValue, node));
    registerCommand('staticWebApps.appSettings.delete', async (context: IActionContext, node?: AzExtTreeItem) => await deleteNode(context, AppSettingTreeItem.contextValue, node));
    registerCommand('staticWebApps.appSettings.edit', editAppSetting);
    registerCommand('staticWebApps.appSettings.rename', renameAppSetting);
    registerCommand('staticWebApps.appSettings.download', downloadAppSettings);
    registerCommand('staticWebApps.appSettings.upload', uploadAppSettings);
    registerCommand('staticWebApps.toggleAppSettingVisibility', async (context: IActionContext, node: AppSettingTreeItem) => { await node.toggleValueVisibility(context); }, 250);
    registerCommand('staticWebApps.showDocumentation', async (_context: IActionContext) => { await openUrl('https://aka.ms/AA92xai'); });
    registerCommand('staticWebApps.showFunctionsDocumentation', async (_context: IActionContext) => { await openUrl('https://aka.ms/AAacf3z'); });
    registerCommand('staticWebApps.openYAMLConfigFile', openYAMLConfigFile);
    registerCommand('staticWebApps.createSwaConfigFile', createSwaConfigFile);
    registerCommand('staticWebApps.openGitHubLog', openGitHubLog);

    // Suppress "Report an Issue" button for all errors in favor of the command
    registerErrorHandler(c => c.errorHandling.suppressReportIssue = true);
    registerReportIssueCommand('staticWebApps.reportIssue');
}
