/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { StaticSiteARMResource, StaticSiteBuildARMResource, WebSiteManagementClient } from "@azure/arm-appservice";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzExtParentTreeItem, AzExtTreeItem, AzureWizard, IActionContext, ISubscriptionContext, TreeItemIconPath, nonNullProp, openUrl } from "@microsoft/vscode-azext-utils";
import { AppResource, ResolvedAppResourceTreeItem } from "@microsoft/vscode-azext-utils/hostapi";
import { ResolvedStaticWebApp } from "../StaticWebAppResolver";
import { ConfirmDeleteStep } from "../commands/deleteStaticWebApp/ConfirmDeleteStep";
import { DeleteResourceGroupStep } from "../commands/deleteStaticWebApp/DeleteResourceGroupStep";
import { IDeleteWizardContext } from "../commands/deleteStaticWebApp/IDeleteWizardContext";
import { StaticWebAppDeleteStep } from "../commands/deleteStaticWebApp/StaticWebAppDeleteStep";
import { onlyGitHubSupported, productionEnvironmentName } from '../constants';
import { createActivityContext } from "../utils/activityUtils";
import { createWebSiteClient } from "../utils/azureClients";
import { getResourceGroupFromId } from "../utils/azureUtils";
import { createTreeItemsWithErrorHandling } from "../utils/createTreeItemsWithErrorHandling";
import { getRepoFullname } from '../utils/gitUtils';
import { localize } from "../utils/localize";
import { treeUtils } from "../utils/treeUtils";
import { EnvironmentTreeItem } from './EnvironmentTreeItem';

export type ResolvedStaticWebAppTreeItem = ResolvedAppResourceTreeItem<ResolvedStaticWebApp>;

export function isResolvedStaticWebAppTreeItem(t: unknown): t is ResolvedStaticWebApp {
    return (t as ResolvedStaticWebApp)?.data?.type?.toLowerCase() === 'microsoft.web/staticsites';
}

export class StaticWebAppTreeItem implements ResolvedStaticWebApp {
    public static contextValue: string = 'azureStaticWebApp';
    public readonly data: StaticSiteARMResource;
    public readonly childTypeLabel: string = localize('environment', 'Environment');

    public name: string;
    public resourceGroup: string;
    public label: string;
    public repositoryUrl: string;
    public branch: string;
    public defaultHostname: string;

    public contextValuesToAdd?: string[] = [];

    private readonly _subscription: ISubscriptionContext;
    readonly viewProperties;

    constructor(context: IActionContext, subscription: ISubscriptionContext, ss: StaticSiteARMResource & AppResource) {
        this.data = ss;
        this.name = nonNullProp(this.data, 'name');
        this.resourceGroup = getResourceGroupFromId(ss.id);
        this.label = this.name;
        this._subscription = subscription;

        this.viewProperties = {
            data: this.data,
            label: this.name
        };

        this.contextValuesToAdd?.push(StaticWebAppTreeItem.contextValue);

        if (this.data.repositoryUrl) {
            this.repositoryUrl = this.data.repositoryUrl;
        } else {
            context.errorHandling.suppressDisplay = true;
            throw new Error(onlyGitHubSupported);
        }

        this.branch = nonNullProp(this.data, 'branch');
        this.defaultHostname = nonNullProp(this.data, 'defaultHostname');
    }

    public get description(): string | undefined {
        const { owner, name } = getRepoFullname(this.repositoryUrl);
        return `${owner}/${name}`;
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getIconPath('azure-staticwebapps');
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        const client: WebSiteManagementClient = await createWebSiteClient([context, this._subscription]);
        const envs = await uiUtils.listAllIterator(client.staticSites.listStaticSiteBuilds(this.resourceGroup, this.name));
        // extract to static utility on azextparenttreeitem
        return await createTreeItemsWithErrorHandling(
            undefined as unknown as AzExtParentTreeItem,
            envs,
            'invalidStaticEnvironment',
            async (env: StaticSiteBuildARMResource) => {
                return await EnvironmentTreeItem.createEnvironmentTreeItem(context, this as unknown as AzExtParentTreeItem, env);
            },
            env => env.buildId
        );
    }

    public async deleteTreeItemImpl(context: IActionContext): Promise<void> {
        const wizardContext: IDeleteWizardContext = {
            ...context,
            node: this as ResolvedStaticWebAppTreeItem,
            subscription: this._subscription,
            ...(await createActivityContext())
        };

        const wizard = new AzureWizard<IDeleteWizardContext>(wizardContext, {
            title: localize('deleteSwa', 'Delete Static Web App "{0}"', this.name),
            promptSteps: [new ConfirmDeleteStep()],
            executeSteps: [new StaticWebAppDeleteStep(), new DeleteResourceGroupStep()]
        });

        await wizard.prompt();
        await wizard.execute();
    }

    // possibly return null to indicate to run super
    public compareChildrenImpl(ti1: AzExtTreeItem, ti2: AzExtTreeItem): number {
        // production environment should always be on top
        if (ti1.label === productionEnvironmentName) {
            return -1;
        } else if (ti2.label === productionEnvironmentName) {
            return 1;
        }

        // return super.compareChildrenImpl(ti1, ti2);
        return ti1.label.localeCompare(ti2.label);
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async browse(): Promise<void> {
        await openUrl(`https://${this.defaultHostname}`);
    }
}
