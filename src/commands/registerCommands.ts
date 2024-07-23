/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AppSettingTreeItem, AppSettingsTreeItem } from "@microsoft/vscode-azext-azureappsettings";
import { AzExtParentTreeItem, AzExtTreeItem, IActionContext, nonNullValue, openUrl, registerCommand, registerCommandWithTreeNodeUnwrapping, registerErrorHandler, registerReportIssueCommand } from '@microsoft/vscode-azext-utils';
import { downloadAppSettings } from './appSettings/downloadAppSettings';
import { editAppSetting } from './appSettings/editAppSetting';
import { renameAppSetting } from './appSettings/renameAppSetting';
import { uploadAppSettings } from './appSettings/uploadAppSettings';
import { browse } from './browse';
import { installOrUpdateSwaCli } from './cli/installOrUpdateSwaCli';
import { uninstallSwaCli } from './cli/uninstallSwaCli';
import { createChildNode } from './createChildNode';
import { createHttpFunction } from './createHttpFunction';
import { createStaticWebApp, createStaticWebAppAdvanced } from './createStaticWebApp/createStaticWebApp';
import { createSwaConfigFile } from './createSwaConfigFile';
import { deleteEnvironment } from './deleteEnvironment';
import { deleteNode } from './deleteNode';
import { deleteStaticWebApp } from './deleteStaticWebApp/deleteStaticWebApp';
import { cancelAction, rerunAction } from './github/actionCommands';
import { cloneRepo } from './github/cloneRepo';
import { openGitHubLog } from './github/jobLogs/openGitHubLog';
import { openGitHubRepo } from './github/openGitHubRepo';
import { showActions } from './github/showActions';
import { openInPortal } from './openInPortal';
import { openYAMLConfigFile } from "./openYAMLConfigFile";
import { viewProperties } from './viewProperties';

export function registerCommands(): void {
    registerCommandWithTreeNodeUnwrapping('staticWebApps.createStaticWebApp', createStaticWebApp);
    registerCommandWithTreeNodeUnwrapping('staticWebApps.createStaticWebAppAdvanced', createStaticWebAppAdvanced);
    registerCommandWithTreeNodeUnwrapping('staticWebApps.deleteStaticWebApp', deleteStaticWebApp);
    registerCommandWithTreeNodeUnwrapping('staticWebApps.deleteEnvironment', deleteEnvironment);
    registerCommandWithTreeNodeUnwrapping('staticWebApps.openInPortal', openInPortal);
    registerCommandWithTreeNodeUnwrapping('staticWebApps.viewProperties', viewProperties);
    registerCommand('staticWebApps.createHttpFunction', createHttpFunction);
    registerCommandWithTreeNodeUnwrapping('staticWebApps.browse', browse);
    registerCommandWithTreeNodeUnwrapping('staticWebApps.showActions', showActions);
    registerCommandWithTreeNodeUnwrapping('staticWebApps.action.rerun', rerunAction);
    registerCommandWithTreeNodeUnwrapping('staticWebApps.action.cancel', cancelAction);
    registerCommandWithTreeNodeUnwrapping('staticWebApps.cloneRepo', cloneRepo);
    registerCommandWithTreeNodeUnwrapping('staticWebApps.openGitHubRepo', openGitHubRepo);
    registerCommandWithTreeNodeUnwrapping('staticWebApps.appSettings.add', async (context: IActionContext, node?: AzExtParentTreeItem) => await createChildNode(context, new RegExp(AppSettingsTreeItem.contextValue), node));
    registerCommandWithTreeNodeUnwrapping('staticWebApps.appSettings.delete', async (context: IActionContext, node?: AzExtTreeItem) => await deleteNode(context, new RegExp(AppSettingTreeItem.contextValue), node));
    registerCommandWithTreeNodeUnwrapping('staticWebApps.appSettings.edit', editAppSetting);
    registerCommandWithTreeNodeUnwrapping('staticWebApps.appSettings.rename', renameAppSetting);
    registerCommandWithTreeNodeUnwrapping('staticWebApps.appSettings.download', downloadAppSettings);
    registerCommandWithTreeNodeUnwrapping('staticWebApps.appSettings.upload', uploadAppSettings);
    registerCommandWithTreeNodeUnwrapping('staticWebApps.toggleAppSettingVisibility', async (context: IActionContext, node?: AppSettingTreeItem) => { await nonNullValue(node).toggleValueVisibility(context); }, 250);
    registerCommand('staticWebApps.showDocumentation', async (_context: IActionContext) => { await openUrl('https://aka.ms/AA92xai'); });
    registerCommand('staticWebApps.showFunctionsDocumentation', async (_context: IActionContext) => { await openUrl('https://aka.ms/AAacf3z'); });
    registerCommandWithTreeNodeUnwrapping('staticWebApps.openYAMLConfigFile', openYAMLConfigFile);
    registerCommand('staticWebApps.createSwaConfigFile', createSwaConfigFile);
    registerCommandWithTreeNodeUnwrapping('staticWebApps.openGitHubLog', openGitHubLog);
    registerCommand('staticWebApps.installOrUpdateStaticWebAppsCli', installOrUpdateSwaCli);
    registerCommand('staticWebApps.uninstallStaticWebAppsCli', uninstallSwaCli);

    // Suppress "Report an Issue" button for all errors in favor of the command
    registerErrorHandler(c => c.errorHandling.suppressReportIssue = true);
    registerReportIssueCommand('staticWebApps.reportIssue');
}
