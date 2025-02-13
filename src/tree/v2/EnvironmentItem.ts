/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { StaticSiteBuildARMResource, WebSiteManagementClient } from "@azure/arm-appservice";
import { IActionContext, ISubscriptionContext, TreeElementBase, createContextValue, createSubscriptionContext, nonNullProp } from "@microsoft/vscode-azext-utils";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { TreeItem, TreeItemCollapsibleState, Uri } from "vscode";
import { onlyGitHubSupported, productionEnvironmentName } from "../../constants";
import { ext } from "../../extensionVariables";
import { createWebSiteClient } from "../../utils/azureClients";
import { tryGetRepoDataForCreation } from "../../utils/gitHubUtils";
import { tryGetLocalBranch } from "../../utils/gitUtils";
import { localize } from "../../utils/localize";
import { treeUtils } from "../../utils/treeUtils";
import { getSingleRootFsPath } from "../../utils/workspaceUtils";
import { ActionsItem } from "./ActionsItem";
import { StaticWebAppModel } from "./StaticWebAppItem";
import { StaticWebAppsItem } from "./StaticWebAppsBranchDataProvider";

export class EnvironmentItem implements StaticWebAppsItem {
    static readonly contextValue: string = 'environmentItem';
    static readonly contextValueRegExp: RegExp = new RegExp(EnvironmentItem.contextValue);

    id: string;

    isProduction: boolean;
    inWorkspace!: boolean;

    // GitHub
    branch: string;
    repositoryUrl: string;
    localProjectPath: Uri | undefined;

    // Cached children
    actionsTreeItem?: ActionsItem;
    // gitHubConfigGroupTreeItems!: WorkflowGroupTreeItem[];
    // appSettingsTreeItem?: AppSettingsTreeItem;
    // functionsTreeItem?: FunctionsTreeItem;

    constructor(
        readonly subscription: AzureSubscription,
        readonly staticWebApp: StaticWebAppModel,
        private staticSiteBuild: StaticSiteBuildARMResource,
    ) {
        this.id = `${nonNullProp(staticWebApp, 'id')}/environments`;

        if (staticSiteBuild.sourceBranch) {
            this.repositoryUrl = nonNullProp(staticWebApp, 'repositoryUrl');
            this.branch = staticSiteBuild.sourceBranch;
        } else {
            throw new Error(onlyGitHubSupported);
        }

        this.isProduction = staticSiteBuild.buildId === 'default';

        // StaticSiteBuild source branch is formatted as GitHubAccount:branch name for non-production builds
        // split the : because branch names cannot contain colons
        if (!this.isProduction) {
            const colon: string = ':';
            if (this.branch.includes(colon)) {
                this.branch = this.branch.split(colon)[1];
            }
        }
    }

    getTreeItem(): TreeItem {
        return {
            id: this.id,
            label: this.isProduction ? productionEnvironmentName : `${this.staticSiteBuild.pullRequestTitle}`,
            description: this.description,
            contextValue: this.contextValue,
            iconPath: treeUtils.getIconPath('Azure-Static-Apps-Environment'),
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        };
    }

    async getChildren(): Promise<TreeElementBase[]> {
        const children: TreeElementBase[] = [];
        if (this.actionsTreeItem) {
            children.push(this.actionsTreeItem);
        }
        return children;
    }

    public static async createEnvironmentItem(context: IActionContext, subscription: AzureSubscription, swa: StaticWebAppModel, ssb: StaticSiteBuildARMResource): Promise<EnvironmentItem> {
        const ti: EnvironmentItem = new EnvironmentItem(subscription, swa, ssb);
        // initialize inWorkspace property
        await ti.refresh(context);
        return ti;
    }

    public async refresh(context: IActionContext): Promise<void> {
        const subscriptionContext: ISubscriptionContext = createSubscriptionContext(this.subscription);
        const client: WebSiteManagementClient = await createWebSiteClient([context, subscriptionContext]);

        const buildId: string = nonNullProp(this.staticSiteBuild, 'buildId');
        this.staticSiteBuild = await client.staticSites.getStaticSiteBuild(this.staticWebApp.resourceGroup, this.staticWebApp.name, buildId);
        this.localProjectPath = getSingleRootFsPath();
        this.actionsTreeItem = new ActionsItem(this.id, ext.prefix, this.repositoryUrl, this.branch);

        // try {
        //     await client.staticSites.listStaticSiteBuildFunctionAppSettings(this.staticWebApp.resourceGroup, this.staticWebApp.name, buildId);
        //     this.appSettingsTreeItem = new AppSettingsTreeItem(this, new SwaAppSettingsClientProvider(this), ext.prefix, {
        //         contextValuesToAdd: ['staticWebApps']
        //     });
        //     this.functionsTreeItem = new FunctionsTreeItem(this);
        // } catch {
        //     // if it errors here, then there is no Functions API
        //     this.appSettingsTreeItem = undefined;
        //     this.functionsTreeItem = undefined;
        // }

        const remote: string | undefined = (await tryGetRepoDataForCreation(context, this.localProjectPath))?.html_url;
        const branch: string | undefined = remote ? await tryGetLocalBranch() : undefined;

        this.inWorkspace = this.staticWebApp.repositoryUrl === remote && this.branch === branch;
        // this.gitHubConfigGroupTreeItems = await WorkflowGroupTreeItem.createGitHubConfigGroupTreeItems(context, this);
    }

    get browseUrl(): string {
        return `https://${this.staticSiteBuild.hostname}`;
    }

    get gitHubUrl(): string {
        return `${this.repositoryUrl}/tree/${this.branch}`;
    }

    get contextValue(): string {
        const values: string[] = [EnvironmentItem.contextValue];
        return createContextValue(values);
    }

    get description(): string | undefined {
        if (this.staticSiteBuild.status !== 'Ready') {
            // if the environment isn't ready, the status has priority over displaying its linked
            return localize('statusTag', '{0} ({1})', this.branch, this.staticSiteBuild.status);
        }

        const linkedTag: string = localize('linkedTag', '{0} (linked)', this.branch);
        return this.inWorkspace ? linkedTag : this.branch;
    }
}

// Todo: Compare children implementation
// Todo: Delete implementation
