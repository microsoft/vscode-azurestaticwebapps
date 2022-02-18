import { GenericResource } from "@azure/arm-resources";
import { AzExtParentTreeItem, callWithTelemetryAndErrorHandling, IActionContext, ISubscriptionContext, nonNullProp } from "@microsoft/vscode-azext-utils";
import { ApplicationResourceResolver, ResolveResult } from "./api";
import { StaticWebAppTreeItem } from "./tree/StaticWebAppTreeItem";
import { createWebSiteClient } from "./utils/azureClients";
import { getResourceGroupFromId } from "./utils/azureUtils";

export class StaticWebAppResolver implements ApplicationResourceResolver {

    public async resolveResource(subContext: ISubscriptionContext, resource: GenericResource): Promise<ResolveResult | undefined> {
        return await callWithTelemetryAndErrorHandling('resolveResource', async (context: IActionContext) => {

            console.log('subContext', subContext);
            try {
                const client = await createWebSiteClient({ ...context, ...subContext });
                const swa = await client.staticSites.getStaticSite(getResourceGroupFromId(nonNullProp(resource, 'id')), nonNullProp(resource, 'name'));
                return {
                    treeItem: (parent: AzExtParentTreeItem) => new StaticWebAppTreeItem(parent, swa),
                    description: 'resolved',
                    contextValue: 'azureStaticWebApp'
                }
            } catch (e) {
                console.error({ ...context, ...subContext });
                throw e;
            }
        });
    }
}
