/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementClient, WebSiteManagementModels } from "@azure/arm-appservice";
import { ProgressLocation, ThemeIcon, window } from "vscode";
import { AppSettingsTreeItem, AppSettingTreeItem } from "vscode-azureappservice";
import { AzExtTreeItem, AzureParentTreeItem, GenericTreeItem, IActionContext, TreeItemIconPath } from "vscode-azureextensionui";
import { AppSettingsClient } from "../commands/appSettings/AppSettingsClient";
import { onlyGitHubSupported, productionEnvironmentName } from "../constants";
import { ext } from "../extensionVariables";
import { createWebSiteClient } from "../utils/azureClients";
import { pollAzureAsyncOperation } from "../utils/azureUtils";
import { tryGetRepoDataForCreation } from "../utils/gitHubUtils";
import { tryGetLocalBranch } from "../utils/gitUtils";
import { localize } from "../utils/localize";
import { nonNullProp } from "../utils/nonNull";
import { openUrl } from "../utils/openUrl";
import { treeUtils } from "../utils/treeUtils";
import { getSingleRootFsPath } from "../utils/workspaceUtils";
import { ActionsTreeItem } from "./ActionsTreeItem";
import { ActionTreeItem } from "./ActionTreeItem";
import { FunctionsTreeItem } from "./FunctionsTreeItem";
import { FunctionTreeItem } from "./FunctionTreeItem";
import { IAzureResourceTreeItem } from "./IAzureResourceTreeItem";
import { GitHubConfigGroupTreeItem } from "./localProject/ConfigGroupTreeItem";
import { StaticWebAppTreeItem } from "./StaticWebAppTreeItem";

export class EnvironmentTreeItem extends AzureParentTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'azureStaticEnvironment';
    public readonly contextValue: string = EnvironmentTreeItem.contextValue;

    public parent: StaticWebAppTreeItem;
    public actionsTreeItem: ActionsTreeItem;
    public gitHubConfigGroupTreeItems: GitHubConfigGroupTreeItem[];
    public appSettingsTreeItem: AppSettingsTreeItem;
    public functionsTreeItem: FunctionsTreeItem;
    public data: WebSiteManagementModels.StaticSiteBuildARMResource;

    public name: string;
    public id: string;
    public label: string;
    public repositoryUrl: string;
    public branch: string;
    public buildId: string;
    public localProjectPath: string | undefined;

    public isProduction: boolean;
    public inWorkspace: boolean;

    constructor(parent: StaticWebAppTreeItem, env: WebSiteManagementModels.StaticSiteBuildARMResource) {
        super(parent);
        this.data = env;
        this.actionsTreeItem = new ActionsTreeItem(this);
        this.appSettingsTreeItem = new AppSettingsTreeItem(this, new AppSettingsClient(this));
        this.functionsTreeItem = new FunctionsTreeItem(this);

        this.name = nonNullProp(this.data, 'name');
        this.id = nonNullProp(this.data, 'id');
        this.buildId = nonNullProp(this.data, 'buildId');

        this.repositoryUrl = this.parent.repositoryUrl;

        if (this.data.sourceBranch) {
            this.branch = this.data.sourceBranch;
        } else {
            throw new Error(onlyGitHubSupported);
        }

        this.isProduction = this.buildId === 'default';

        // StaticSiteBuild source branch is formatted as GitHubAccount:branch name for non-production builds
        // split the : because branch names cannot contain colons
        if (!this.isProduction) {
            const colon: string = ':';
            if (this.branch.includes(colon)) {
                this.branch = this.branch.split(colon)[1];
            }
        }
        this.label = this.isProduction ? productionEnvironmentName : `${this.data.pullRequestTitle}`;
    }

    public static async createEnvironmentTreeItem(context: IActionContext, parent: StaticWebAppTreeItem, env: WebSiteManagementModels.StaticSiteBuildARMResource): Promise<EnvironmentTreeItem> {
        const ti: EnvironmentTreeItem = new EnvironmentTreeItem(parent, env);
        // initialize inWorkspace property
        await ti.refreshImpl(context);
        return ti;
    }

    public get description(): string | undefined {
        if (this.data.status !== 'Ready') {
            // if the environment isn't ready, the status has priority over displaying its linked
            return localize('statusTag', '{0} ({1})', this.branch, this.data.status);
        }

        const linkedTag: string = localize('linkedTag', '{0} (linked)', this.branch);
        return this.inWorkspace ? linkedTag : this.branch;
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getIconPath('Azure-Static-Apps-Environment');
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        const children: AzExtTreeItem[] = [this.actionsTreeItem];
        if (this.inWorkspace) {
            children.push(...this.gitHubConfigGroupTreeItems);
        }

        const client: WebSiteManagementClient = await createWebSiteClient(this.root);
        const functions: WebSiteManagementModels.StaticSiteFunctionOverviewCollection = await client.staticSites.listStaticSiteBuildFunctions(this.parent.resourceGroup, this.parent.name, this.buildId);
        if (functions.length === 0) {
            context.telemetry.properties.hasFunctions = 'false';
            children.push(new GenericTreeItem(this, {
                label: localize('noFunctions', 'Learn how to add an API with Azure Functions...'),
                contextValue: 'noFunctions',
                commandId: 'staticWebApps.showFunctionsDocumentation',
                iconPath: new ThemeIcon('book')
            }));
        } else {
            context.telemetry.properties.hasFunctions = 'true';
            children.push(this.appSettingsTreeItem, this.functionsTreeItem);
        }

        return children;
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async deleteTreeItemImpl(): Promise<void> {
        const deleting: string = localize('deleting', 'Deleting environment "{0}"...', this.label);
        await window.withProgress({ location: ProgressLocation.Notification, title: deleting }, async (): Promise<void> => {
            ext.outputChannel.appendLog(deleting);
            const client: WebSiteManagementClient = await createWebSiteClient(this.root);
            await pollAzureAsyncOperation(await client.staticSites.deleteStaticSiteBuild(this.parent.resourceGroup, this.parent.name, this.buildId), this.root.credentials);

            const deleteSucceeded: string = localize('deleteSucceeded', 'Successfully deleted environment "{0}".', this.label);
            void window.showInformationMessage(deleteSucceeded);
            ext.outputChannel.appendLog(deleteSucceeded);
        });
    }

    public async browse(): Promise<void> {
        await openUrl(`https://${this.data.hostname}`);
    }

    public pickTreeItemImpl(expectedContextValues: (string | RegExp)[]): AzExtTreeItem | undefined {
        for (const expectedContextValue of expectedContextValues) {
            switch (expectedContextValue) {
                case AppSettingsTreeItem.contextValue:
                case AppSettingTreeItem.contextValue:
                    return this.appSettingsTreeItem;
                case ActionsTreeItem.contextValue:
                case ActionTreeItem.contextValueCompleted:
                case ActionTreeItem.contextValueInProgress:
                    return this.actionsTreeItem;
                case FunctionsTreeItem.contextValue:
                case FunctionTreeItem.contextValue:
                    return this.functionsTreeItem;
                default:
            }
        }

        return undefined;
    }

    public compareChildrenImpl(): number {
        return 0; // already sorted
    }

    public async refreshImpl(context: IActionContext): Promise<void> {
        const client: WebSiteManagementClient = await createWebSiteClient(this.root);
        this.data = await client.staticSites.getStaticSiteBuild(this.parent.resourceGroup, this.parent.name, this.buildId);
        this.localProjectPath = getSingleRootFsPath();

        const remote: string | undefined = (await tryGetRepoDataForCreation(context))?.html_url;
        const branch: string | undefined = remote ? await tryGetLocalBranch() : undefined;
        this.inWorkspace = this.parent.repositoryUrl === remote && this.branch === branch;

        this.gitHubConfigGroupTreeItems = await GitHubConfigGroupTreeItem.createGitHubConfigGroupTreeItems(this);
    }
}
