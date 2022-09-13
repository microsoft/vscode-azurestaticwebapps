/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AppSettingsTreeItem, AppSettingTreeItem } from '@microsoft/vscode-azext-azureappservice';
import { AzExtParentTreeItem, AzExtTreeItem, IActionContext, registerCommandWithTreeNodeUnboxing, registerErrorHandler, registerReportIssueCommand } from '@microsoft/vscode-azext-utils';
import { openUrl } from '../utils/openUrl';
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
import { openYAMLConfigFile } from './openYAMLConfigFile';
import { viewProperties } from './viewProperties';

export function registerCommands(): void {
    registerCommandWithTreeNodeUnboxing('staticWebApps.createStaticWebApp', createStaticWebApp);
    registerCommandWithTreeNodeUnboxing('staticWebApps.createStaticWebAppAdvanced', createStaticWebAppAdvanced);
    registerCommandWithTreeNodeUnboxing('staticWebApps.deleteStaticWebApp', deleteStaticWebApp);
    registerCommandWithTreeNodeUnboxing('staticWebApps.deleteEnvironment', deleteEnvironment);
    registerCommandWithTreeNodeUnboxing('staticWebApps.openInPortal', openInPortal);
    registerCommandWithTreeNodeUnboxing('staticWebApps.viewProperties', viewProperties);
    registerCommandWithTreeNodeUnboxing('staticWebApps.createHttpFunction', createHttpFunction);
    registerCommandWithTreeNodeUnboxing('staticWebApps.browse', browse);
    registerCommandWithTreeNodeUnboxing('staticWebApps.showActions', showActions);
    registerCommandWithTreeNodeUnboxing('staticWebApps.action.rerun', rerunAction);
    registerCommandWithTreeNodeUnboxing('staticWebApps.action.cancel', cancelAction);
    registerCommandWithTreeNodeUnboxing('staticWebApps.cloneRepo', cloneRepo);
    registerCommandWithTreeNodeUnboxing('staticWebApps.openGitHubRepo', openGitHubRepo);
    registerCommandWithTreeNodeUnboxing('staticWebApps.appSettings.add', async (context: IActionContext, node?: AzExtParentTreeItem) => await createChildNode(context, new RegExp(AppSettingsTreeItem.contextValue), node));
    registerCommandWithTreeNodeUnboxing('staticWebApps.appSettings.delete', async (context: IActionContext, node?: AzExtTreeItem) => await deleteNode(context, new RegExp(AppSettingTreeItem.contextValue), node));
    registerCommandWithTreeNodeUnboxing('staticWebApps.appSettings.edit', editAppSetting);
    registerCommandWithTreeNodeUnboxing('staticWebApps.appSettings.rename', renameAppSetting);
    registerCommandWithTreeNodeUnboxing('staticWebApps.appSettings.download', downloadAppSettings);
    registerCommandWithTreeNodeUnboxing('staticWebApps.appSettings.upload', uploadAppSettings);
    registerCommandWithTreeNodeUnboxing('staticWebApps.toggleAppSettingVisibility', async (context: IActionContext, node: AppSettingTreeItem) => { await node.toggleValueVisibility(context); }, 250);
    registerCommandWithTreeNodeUnboxing('staticWebApps.showDocumentation', async (_context: IActionContext) => { await openUrl('https://aka.ms/AA92xai'); });
    registerCommandWithTreeNodeUnboxing('staticWebApps.showFunctionsDocumentation', async (_context: IActionContext) => { await openUrl('https://aka.ms/AAacf3z'); });
    registerCommandWithTreeNodeUnboxing('staticWebApps.openYAMLConfigFile', openYAMLConfigFile);
    registerCommandWithTreeNodeUnboxing('staticWebApps.createSwaConfigFile', createSwaConfigFile);
    registerCommandWithTreeNodeUnboxing('staticWebApps.openGitHubLog', openGitHubLog);
    registerCommandWithTreeNodeUnboxing('staticWebApps.installOrUpdateStaticWebAppsCli', installOrUpdateSwaCli);
    registerCommandWithTreeNodeUnboxing('staticWebApps.uninstallStaticWebAppsCli', uninstallSwaCli);

    // Suppress "Report an Issue" button for all errors in favor of the command
    registerErrorHandler(c => c.errorHandling.suppressReportIssue = true);
    registerReportIssueCommand('staticWebApps.reportIssue');
}
