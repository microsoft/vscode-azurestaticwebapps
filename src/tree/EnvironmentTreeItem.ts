/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { StaticSiteBuildARMResource, WebSiteManagementClient } from "@azure/arm-appservice";
import { AppSettingTreeItem, AppSettingsTreeItem } from "@microsoft/vscode-azext-azureappsettings";
import { AzExtParentTreeItem, AzExtTreeItem, GenericTreeItem, IActionContext, TreeItemIconPath, nonNullProp, openUrl } from "@microsoft/vscode-azext-utils";
import { ResolvedAppResourceTreeItem } from "@microsoft/vscode-azext-utils/hostapi";
import { ProgressLocation, ThemeIcon, Uri, window } from "vscode";
import { ResolvedStaticWebApp } from "../StaticWebAppResolver";
import { SwaAppSettingsClientProvider } from "../commands/appSettings/AppSettingsClient";
import { onlyGitHubSupported, productionEnvironmentName } from "../constants";
import { ext } from "../extensionVariables";
import { createWebSiteClient } from "../utils/azureClients";
import { matchContextValue } from "../utils/contextUtils";
import { tryGetRepoDataForCreation } from "../utils/gitHubUtils";
import { tryGetLocalBranch } from "../utils/gitUtils";
import { localize } from "../utils/localize";
import { treeUtils } from "../utils/treeUtils";
import { getSingleRootFsPath } from "../utils/workspaceUtils";
import { ActionTreeItem } from "./ActionTreeItem";
import { ActionsTreeItem } from "./ActionsTreeItem";
import { FunctionTreeItem } from "./FunctionTreeItem";
import { FunctionsTreeItem } from "./FunctionsTreeItem";
import { IAzureResourceTreeItem } from "./IAzureResourceTreeItem";
import { JobTreeItem } from "./JobTreeItem";
import { StepTreeItem } from "./StepTreeItem";
import { WorkflowGroupTreeItem } from "./WorkflowGroupTreeItem";

export class EnvironmentTreeItem extends AzExtParentTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'azureStaticEnvironment';
    public readonly contextValue: string = EnvironmentTreeItem.contextValue;

    public parent!: AzExtParentTreeItem & ResolvedAppResourceTreeItem<ResolvedStaticWebApp>;
    public data: StaticSiteBuildARMResource;

    public actionsTreeItem!: ActionsTreeItem;
    public gitHubConfigGroupTreeItems!: WorkflowGroupTreeItem[];
    public appSettingsTreeItem?: AppSettingsTreeItem;
    public functionsTreeItem?: FunctionsTreeItem;

    public name: string;
    public label: string;
    public repositoryUrl: string;
    public branch: string;
    public buildId: string;
    public localProjectPath: Uri | undefined;

    public isProduction: boolean;
    public inWorkspace!: boolean;

    constructor(parent: AzExtParentTreeItem, env: StaticSiteBuildARMResource) {
        super(parent);
        this.data = env;

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

    public static async createEnvironmentTreeItem(context: IActionContext, parent: AzExtParentTreeItem, env: StaticSiteBuildARMResource): Promise<EnvironmentTreeItem> {
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
        if (!this.functionsTreeItem || !this.appSettingsTreeItem) {
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

        if (this.inWorkspace) {
            children.push(...this.gitHubConfigGroupTreeItems);
        }

        return children;
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async deleteTreeItemImpl(context: IActionContext): Promise<void> {
        const deleting: string = localize('deleting', 'Deleting environment "{0}"...', this.label);
        await window.withProgress({ location: ProgressLocation.Notification, title: deleting }, async (): Promise<void> => {
            ext.outputChannel.appendLog(deleting);
            const client: WebSiteManagementClient = await createWebSiteClient([context, this]);
            await client.staticSites.beginDeleteStaticSiteBuildAndWait(this.parent.resourceGroup, this.parent.name, this.buildId);
            const deleteSucceeded: string = localize('deleteSucceeded', 'Successfully deleted environment "{0}".', this.label);
            void window.showInformationMessage(deleteSucceeded);
            ext.outputChannel.appendLog(deleteSucceeded);
        });
    }

    public async browse(): Promise<void> {
        await openUrl(`https://${this.data.hostname}`);
    }

    public pickTreeItemImpl(expectedContextValues: (string | RegExp)[]): AzExtTreeItem | undefined {
        const noApiError: string = localize('noAPI', 'No Functions API associated with "{0}"', `${this.parent.label}/${this.label}`);
        for (const expectedContextValue of expectedContextValues) {
            if (matchContextValue(expectedContextValue, [new RegExp(AppSettingTreeItem.contextValue), new RegExp(AppSettingsTreeItem.contextValue)])) {
                if (!this.appSettingsTreeItem) {
                    throw new Error(noApiError);
                }
                return this.appSettingsTreeItem;
            }

            if (matchContextValue(expectedContextValue, [FunctionTreeItem.contextValue, FunctionsTreeItem.contextValue])) {
                if (!this.functionsTreeItem) {
                    throw new Error(noApiError);
                }
                return this.functionsTreeItem;
            }

            const actionsContextValues = [ActionsTreeItem.contextValue, ActionTreeItem.contextValueCompleted, ActionTreeItem.contextValueInProgress, JobTreeItem.contextValue, StepTreeItem.contextValue];
            if (matchContextValue(expectedContextValue, actionsContextValues)) {
                return this.actionsTreeItem;
            }
        }

        return undefined;
    }

    public compareChildrenImpl(ti1: AzExtTreeItem, ti2: AzExtTreeItem): number {
        if (ti1 instanceof GenericTreeItem) {
            return 1;
        } else if (ti2 instanceof GenericTreeItem) {
            return -1;
        }

        return 0;
    }

    public async refreshImpl(context: IActionContext): Promise<void> {
        const client: WebSiteManagementClient = await createWebSiteClient([context, this]);
        this.data = await client.staticSites.getStaticSiteBuild(this.parent.resourceGroup, this.parent.name, this.buildId);
        this.localProjectPath = getSingleRootFsPath();

        this.actionsTreeItem = new ActionsTreeItem(this);
        try {
            await client.staticSites.listStaticSiteBuildFunctionAppSettings(this.parent.resourceGroup, this.parent.name, this.buildId);
            this.appSettingsTreeItem = new AppSettingsTreeItem(this, new SwaAppSettingsClientProvider(this), ext.prefix, {
                contextValuesToAdd: ['staticWebApps']
            });
            this.functionsTreeItem = new FunctionsTreeItem(this);
        } catch {
            // if it errors here, then there is no Functions API
            this.appSettingsTreeItem = undefined;
            this.functionsTreeItem = undefined;
        }

        const remote: string | undefined = (await tryGetRepoDataForCreation(context, this.localProjectPath))?.html_url;
        const branch: string | undefined = remote ? await tryGetLocalBranch() : undefined;
        this.inWorkspace = this.parent.repositoryUrl === remote && this.branch === branch;

        this.gitHubConfigGroupTreeItems = await WorkflowGroupTreeItem.createGitHubConfigGroupTreeItems(context, this);

    }
}
