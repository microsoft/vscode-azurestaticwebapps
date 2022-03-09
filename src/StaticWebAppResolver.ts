import { AzExtParentTreeItem, callWithTelemetryAndErrorHandling, IActionContext, ISubscriptionContext, nonNullProp } from "@microsoft/vscode-azext-utils";
import { AppResource, AppResourceResolver, ResolvedAppResourceTreeItemBase } from "./api";
import { StaticWebAppTreeItem } from "./tree/StaticWebAppTreeItem";
import { createWebSiteClient } from "./utils/azureClients";
import { getResourceGroupFromId } from "./utils/azureUtils";

export interface ResolvedStaticWebApp extends ResolvedAppResourceTreeItemBase {
    resourceGroup: string;
    name: string;
    repositoryUrl: string;
    branch: string;
    defaultHostname: string;
}

export class StaticWebAppResolver implements AppResourceResolver {

    public async resolveResource(subContext: ISubscriptionContext, resource: AppResource): Promise<ResolvedStaticWebApp | null> {
        return await callWithTelemetryAndErrorHandling('resolveResource', async (context: IActionContext) => {
            try {
                const client = await createWebSiteClient({ ...context, ...subContext });
                const swa = await client.staticSites.getStaticSite(getResourceGroupFromId(nonNullProp(resource, 'id')), nonNullProp(resource, 'name'));

                const ti = new StaticWebAppTreeItem(undefined as unknown as AzExtParentTreeItem, swa);

                const resolved: ResolvedStaticWebApp = {
                    id: ti.id ?? resource.id,
                    contextValue: ti.contextValue,
                    description: ti.description,
                    iconPath: ti.iconPath,
                    label: ti.label,
                    name: ti.name,
                    branch: ti.branch,
                    defaultHostname: ti.defaultHostname,
                    repositoryUrl: ti.repositoryUrl,
                    resourceGroup: ti.resourceGroup,
                    loadMoreChildrenImpl: ti.loadMoreChildrenImpl,
                    deleteTreeItemImpl: ti.deleteTreeItemImpl
                }
                return resolved;

            } catch (e) {
                console.error({ ...context, ...subContext });
                throw e;
            }
        }) ?? null;
    }
}
