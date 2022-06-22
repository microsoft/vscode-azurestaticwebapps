import RLC, { WebSiteManagementClient as RestWebSiteManagementClient } from "@azure-rest/arm-appservice";
import { createGenericClient } from "@microsoft/vscode-azext-azureutils";
import { IActionContext, ISubscriptionContext } from "@microsoft/vscode-azext-utils";

export async function createRlc(context: IActionContext, subContext: ISubscriptionContext): Promise<RestWebSiteManagementClient> {
    const httpClient = await createGenericClient(context, subContext.credentials);

    return RLC(subContext.credentials, {
        apiVersion: '2019-08-01'
    });
}
