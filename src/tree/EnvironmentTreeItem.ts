/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ProgressLocation, window } from "vscode";
import { AppSettingsTreeItem, AppSettingTreeItem } from "vscode-azureappservice";
import { AzExtParentTreeItem, AzExtTreeItem, AzureParentTreeItem, IActionContext, TreeItemIconPath } from "vscode-azureextensionui";
import { AppSettingsClient } from "../commands/appSettings/AppSettingsClient";
import { productionEnvironmentName } from "../constants";
import { ext } from "../extensionVariables";
import { tryGetBranch, tryGetRemote } from "../utils/gitHubUtils";
import { localize } from "../utils/localize";
import { openUrl } from "../utils/openUrl";
import { requestUtils } from "../utils/requestUtils";
import { treeUtils } from "../utils/treeUtils";
import { ActionsTreeItem } from "./ActionsTreeItem";
import { ActionTreeItem } from "./ActionTreeItem";
import { FunctionsTreeItem } from "./FunctionsTreeItem";
import { FunctionTreeItem } from "./FunctionTreeItem";
import { IAzureResourceTreeItem } from "./IAzureResourceTreeItem";
import { StaticWebAppTreeItem } from "./StaticWebAppTreeItem";

export type StaticEnvironment = {
    buildId: string;
    id: string;
    name: string;
    properties: {
        buildId: string;
        pullRequestTitle: string;
        sourceBranch: string;
        hostname: string;
        status: string;
    };
};

export class EnvironmentTreeItem extends AzureParentTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'azureStaticEnvironment';
    public readonly contextValue: string = EnvironmentTreeItem.contextValue;

    public parent: StaticWebAppTreeItem;
    public actionsTreeItem: ActionsTreeItem;
    public appSettingsTreeItem: AppSettingsTreeItem;
    public functionsTreeItem: FunctionsTreeItem;
    public readonly data: StaticEnvironment;
    public inWorkspace: boolean;

    constructor(parent: StaticWebAppTreeItem, env: StaticEnvironment) {
        super(parent);
        this.data = env;
        this.actionsTreeItem = new ActionsTreeItem(this);
        this.appSettingsTreeItem = new AppSettingsTreeItem(this, new AppSettingsClient(this));
        this.functionsTreeItem = new FunctionsTreeItem(this);
    }

    public static async createEnvironmentTreeItem(parent: StaticWebAppTreeItem, env: StaticEnvironment): Promise<EnvironmentTreeItem> {
        const ti: EnvironmentTreeItem = new EnvironmentTreeItem(parent, env);
        // initialize inWorkspace property
        await ti.refreshImpl();
        return ti;
    }

    public get name(): string {
        return this.data.name;
    }

    public get id(): string {
        return this.data.id;
    }

    public get label(): string {
        return this.isProduction ? productionEnvironmentName : `${this.data.properties.pullRequestTitle}`;
    }

    public get description(): string {
        if (this.data.properties.status !== 'Ready') {
            // if the environment isn't ready, the status has priority over displaying its linked
            return localize('statusTag', '{0} ({1})', this.data.properties.sourceBranch, this.data.properties.status);
        }

        const linkedTag: string = localize('linkedTag', '{0} (linked)', this.data.properties.sourceBranch);
        return this.inWorkspace ? linkedTag : this.data.properties.sourceBranch;
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getIconPath('Azure-Static-Apps-Environment');
    }

    public get isProduction(): boolean {
        return this.data.properties.buildId === 'default';
    }

    public get repositoryUrl(): string {
        return this.parent.repositoryUrl;
    }

    public get branch(): string {
        return this.data.properties.sourceBranch;
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, _context: IActionContext): Promise<AzExtParentTreeItem[]> {
        return [this.actionsTreeItem, this.appSettingsTreeItem, this.functionsTreeItem];
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async deleteTreeItemImpl(): Promise<void> {
        const requestOptions: requestUtils.Request = await requestUtils.getDefaultAzureRequest(`${this.id}?api-version=2019-12-01-preview`, this.root, 'DELETE');
        const deleting: string = localize('deleting', 'Deleting environment "{0}"...', this.label);

        await window.withProgress({ location: ProgressLocation.Notification, title: deleting }, async (): Promise<void> => {
            ext.outputChannel.appendLog(deleting);
            await requestUtils.pollAzureAsyncOperation(requestOptions, this.root.credentials);

            const deleteSucceeded: string = localize('deleteSucceeded', 'Successfully deleted environment "{0}".', this.label);
            window.showInformationMessage(deleteSucceeded);
            ext.outputChannel.appendLog(deleteSucceeded);
        });
    }

    public async browse(): Promise<void> {
        await openUrl(`https://${this.data.properties.hostname}`);
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
        this.inWorkspace = this.parent.data.properties.repositoryUrl === remote && this.data.properties.sourceBranch === branch;
    }
}
