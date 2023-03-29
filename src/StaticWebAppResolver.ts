import { StaticSiteARMResource } from "@azure/arm-appservice";
import { callWithTelemetryAndErrorHandling, IActionContext, ISubscriptionContext, nonNullProp } from "@microsoft/vscode-azext-utils";
import { AppResource, AppResourceResolver, ResolvedAppResourceBase } from "@microsoft/vscode-azext-utils/hostapi";
import { StaticWebAppTreeItem } from "./tree/StaticWebAppTreeItem";
import { createWebSiteClient } from "./utils/azureClients";
import { getResourceGroupFromId } from "./utils/azureUtils";

export interface ResolvedStaticWebApp extends ResolvedAppResourceBase {
    resourceGroup: string;
    name: string;
    repositoryUrl: string;
    branch: string;
    defaultHostname: string;
    data: StaticSiteARMResource;
    browse: () => Promise<void>;
}

export class StaticWebAppResolver implements AppResourceResolver {

    // possibly pass down the full tree item, but for now try to get away with just the AppResource
    public async resolveResource(subContext: ISubscriptionContext, resource: AppResource): Promise<ResolvedStaticWebApp | null> {
        return await callWithTelemetryAndErrorHandling('resolveResource', async (context: IActionContext) => {
            try {
                const client = await createWebSiteClient({ ...context, ...subContext });
                const swa = await client.staticSites.getStaticSite(getResourceGroupFromId(nonNullProp(resource, 'id')), nonNullProp(resource, 'name'));

                return new StaticWebAppTreeItem(context, subContext, { ...resource, ...swa });
            } catch (e) {
                console.error({ ...context, ...subContext });
                throw e;
            }
        }) ?? null;
    }

    public matchesResource(resource: AppResource): boolean {
        return resource.type.toLowerCase() === 'microsoft.web/staticsites';
    }
}
