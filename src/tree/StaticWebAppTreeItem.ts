/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { StaticSiteARMResource, StaticSiteBuildARMResource, WebSiteManagementClient } from "@azure/arm-appservice";
import { AzExtClientContext, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzExtParentTreeItem, AzExtTreeItem, IActionContext, ISubscriptionContext, TreeItemIconPath } from "@microsoft/vscode-azext-utils";
import { AppResource, ResolvedAppResourceTreeItem } from "../api";
import { onlyGitHubSupported, productionEnvironmentName } from '../constants';
import { ResolvedStaticWebApp } from "../StaticWebAppResolver";
import { createWebSiteClient } from "../utils/azureClients";
import { getResourceGroupFromId } from "../utils/azureUtils";
import { createTreeItemsWithErrorHandling } from "../utils/createTreeItemsWithErrorHandling";
import { getRepoFullname } from '../utils/gitUtils';
import { localize } from "../utils/localize";
import { nonNullProp } from "../utils/nonNull";
import { openUrl } from '../utils/openUrl';
import { treeUtils } from "../utils/treeUtils";
import { EnvironmentTreeItem } from './EnvironmentTreeItem';

export type ResolvedStaticWebAppTreeItem = ResolvedAppResourceTreeItem<ResolvedStaticWebApp>;

export function isResolvedStaticWebAppTreeItem(t: unknown): t is ResolvedStaticWebAppTreeItem {
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

    constructor(subscription: ISubscriptionContext, ss: StaticSiteARMResource & AppResource) {
        this.data = ss;
        this.name = nonNullProp(this.data, 'name');
        this.resourceGroup = getResourceGroupFromId(ss.id);
        this.label = this.name;
        this._subscription = subscription;

        this.contextValuesToAdd?.push(StaticWebAppTreeItem.contextValue);

        if (this.data.repositoryUrl) {
            this.repositoryUrl = this.data.repositoryUrl;
        } else {
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
        let client: WebSiteManagementClient;
        try {
            const clientContext: AzExtClientContext = [context, this._subscription];
            const subscription = clientContext[1] instanceof AzExtTreeItem ? clientContext[1].subscription : clientContext[1];
            console.log('subscription', subscription);
            client = await createWebSiteClient(clientContext);

        } catch (e) {
            console.error('error creating client in load more children', [context, this]);
            throw e;
        }
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
