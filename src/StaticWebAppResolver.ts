import { StaticSiteARMResourceOutput, StaticSiteOutput } from "@azure-rest/arm-appservice";
import { StaticSiteARMResource } from "@azure/arm-appservice";
import { callWithTelemetryAndErrorHandling, IActionContext, ISubscriptionContext, nonNullProp } from "@microsoft/vscode-azext-utils";
import { AppResource, AppResourceResolver, ResolvedAppResourceBase } from "@microsoft/vscode-azext-utils/hostapi";
import { StaticWebAppTreeItem } from "./tree/StaticWebAppTreeItem";
import { getResourceGroupFromId } from "./utils/azureUtils";
import { createRlc } from "./utils/rlc";

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

                const rlc = await createRlc(subContext);
                const token = await subContext.credentials.getToken();
                console.log(token);
                const ss = await rlc.path('/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/staticSites/{name}',
                    subContext.subscriptionId,
                    getResourceGroupFromId(nonNullProp(resource, 'id')),
                    nonNullProp(resource, 'name')
                ).get({
                    queryParameters: {
                        'api-version': '2019-08-01'
                    },
                    headers: {
                        'Authorization': `Bearer ${token.token}`
                    }
                });

                if (ss.status === '200') {
                    const swa = Object.assign(ss.body, ss.body.properties) as (StaticSiteARMResourceOutput & StaticSiteOutput);
                    return new StaticWebAppTreeItem(subContext, { ...resource, ...swa });
                } else {
                    console.error('Failed to get static site', resource.name);
                    throw new Error(ss.status);
                }

                // const client = await createWebSiteClient({ ...context, ...subContext });
                // const swa: StaticSiteARMResource = await client.staticSites.getStaticSite(getResourceGroupFromId(nonNullProp(resource, 'id')), nonNullProp(resource, 'name'));

                // return new StaticWebAppTreeItem(subContext, { ...resource, ...swa });
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
