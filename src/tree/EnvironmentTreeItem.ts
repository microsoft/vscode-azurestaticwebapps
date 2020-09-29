/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementClient, WebSiteManagementModels } from "@azure/arm-appservice";
import { ProgressLocation, window } from "vscode";
import { AppSettingsTreeItem, AppSettingTreeItem } from "vscode-azureappservice";
import { AzExtParentTreeItem, AzExtTreeItem, AzureParentTreeItem, createAzureClient, IActionContext, TreeItemIconPath } from "vscode-azureextensionui";
import { AppSettingsClient } from "../commands/appSettings/AppSettingsClient";
import { productionEnvironmentName } from "../constants";
import { ext } from "../extensionVariables";
import { pollAzureAsyncOperation } from "../utils/azureUtils";
import { tryGetBranch, tryGetRemote } from "../utils/gitHubUtils";
import { localize } from "../utils/localize";
import { nonNullProp } from "../utils/nonNull";
import { openUrl } from "../utils/openUrl";
import { treeUtils } from "../utils/treeUtils";
import { ActionsTreeItem } from "./ActionsTreeItem";
import { ActionTreeItem } from "./ActionTreeItem";
import { FunctionsTreeItem } from "./FunctionsTreeItem";
import { FunctionTreeItem } from "./FunctionTreeItem";
import { IAzureResourceTreeItem } from "./IAzureResourceTreeItem";
import { StaticWebAppTreeItem } from "./StaticWebAppTreeItem";

export class EnvironmentTreeItem extends AzureParentTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'azureStaticEnvironment';
    public readonly contextValue: string = EnvironmentTreeItem.contextValue;

    public parent: StaticWebAppTreeItem;
    public actionsTreeItem: ActionsTreeItem;
    public appSettingsTreeItem: AppSettingsTreeItem;
    public functionsTreeItem: FunctionsTreeItem;
    public readonly data: WebSiteManagementModels.StaticSiteBuildARMResource;
    public inWorkspace: boolean;

    constructor(parent: StaticWebAppTreeItem, env: WebSiteManagementModels.StaticSiteBuildARMResource) {
        super(parent);
        this.data = env;
        this.actionsTreeItem = new ActionsTreeItem(this);
        this.appSettingsTreeItem = new AppSettingsTreeItem(this, new AppSettingsClient(this));
        this.functionsTreeItem = new FunctionsTreeItem(this);
    }

    public static async createEnvironmentTreeItem(parent: StaticWebAppTreeItem, env: WebSiteManagementModels.StaticSiteBuildARMResource): Promise<EnvironmentTreeItem> {
        const ti: EnvironmentTreeItem = new EnvironmentTreeItem(parent, env);
        // initialize inWorkspace property
        await ti.refreshImpl();
        return ti;
    }

    public get name(): string {
        return nonNullProp(this.data, 'name');
    }

    public get id(): string {
        return nonNullProp(this.data, 'id');
    }

    public get label(): string {
        return this.isProduction ? productionEnvironmentName : `${this.data.pullRequestTitle}`;
    }

    public get description(): string | undefined {
        if (this.data.status !== 'Ready') {
            // if the environment isn't ready, the status has priority over displaying its linked
            return localize('statusTag', '{0} ({1})', this.data.sourceBranch, this.data.status);
        }

        const linkedTag: string = localize('linkedTag', '{0} (linked)', this.data.sourceBranch);
        return this.inWorkspace ? linkedTag : this.data.sourceBranch;
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getIconPath('Azure-Static-Apps-Environment');
    }

    public get isProduction(): boolean {
        return this.data.buildId === 'default';
    }

    public get repositoryUrl(): string {
        return this.parent.repositoryUrl;
    }

    public get branch(): string {
        return nonNullProp(this.data, 'sourceBranch');
    }

    public get buildId(): string {
        return nonNullProp(this.data, 'buildId');
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, _context: IActionContext): Promise<AzExtParentTreeItem[]> {
        return [this.actionsTreeItem, this.appSettingsTreeItem, this.functionsTreeItem];
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async deleteTreeItemImpl(): Promise<void> {
        const deleting: string = localize('deleting', 'Deleting environment "{0}"...', this.label);
        await window.withProgress({ location: ProgressLocation.Notification, title: deleting }, async (): Promise<void> => {
            ext.outputChannel.appendLog(deleting);
            const client: WebSiteManagementClient = createAzureClient(this.root, WebSiteManagementClient);
            await pollAzureAsyncOperation(await client.staticSites.deleteStaticSiteBuild(this.parent.resourceGroup, this.name, this.buildId), this.root.credentials);

            const deleteSucceeded: string = localize('deleteSucceeded', 'Successfully deleted environment "{0}".', this.label);
            window.showInformationMessage(deleteSucceeded);
            ext.outputChannel.appendLog(deleteSucceeded);
        });
    }

    public async browse(): Promise<void> {
        await openUrl(`https://${this.data.hostname}`);
    }

    public async pickTreeItemImpl(expectedContextValues: (string | RegExp)[]): Promise<AzExtTreeItem | undefined> {
        for (const expectedContextValue of expectedContextValues) {
            switch (expectedContextValue) {
                case AppSettingsTreeItem.contextValue:
                case AppSettingTreeItem.contextValue:
                    return this.appSettingsTreeItem;
                case ActionsTreeItem.contextValue:
                case ActionTreeItem.contextValue:
                    return this.actionsTreeItem;
                case FunctionsTreeItem.contextValue:
                case FunctionTreeItem.contextValue:
                    return this.functionsTreeItem;
                default:
            }
        }

        return undefined;
    }

    public async refreshImpl(): Promise<void> {
        const remote: string | undefined = await tryGetRemote();
        const branch: string | undefined = remote ? await tryGetBranch() : undefined;
        this.inWorkspace = this.parent.data.repositoryUrl === remote && this.data.sourceBranch === branch;
    }
}
