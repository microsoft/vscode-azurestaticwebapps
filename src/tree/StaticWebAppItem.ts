import { getResourceGroupFromId } from "@microsoft/vscode-azext-azureutils";
import { callWithTelemetryAndErrorHandling, nonNullProp } from "@microsoft/vscode-azext-utils";
import { ProviderResult, TreeItem } from "vscode";
import { ISubscriptionContext } from "vscode-azureextensiondev";
import { createWebSiteClient } from "../utils/azureClients";
import { getRepoFullname } from "../utils/gitUtils";
import { ApplicationResource } from "../vscode-azureresourcegroups.api.v2";
import { StaticWebAppModel } from "./StaticWebAppModel";

export class StaticWebAppItem implements StaticWebAppModel {
    constructor(private readonly resource: ApplicationResource) { }

    getChildren(): ProviderResult<StaticWebAppModel[]> {
        return [];
    }

    async getTreeItem(): Promise<TreeItem> {

        return await callWithTelemetryAndErrorHandling<TreeItem>('getTreeItem', async (context) => {

            const client = await createWebSiteClient({ ...context, ...this.getSubscription() });
            const swa = await client.staticSites.getStaticSite(getResourceGroupFromId(nonNullProp(this.resource, 'id')), nonNullProp(this.resource, 'name'));

            return Promise.resolve({
                label: swa.name,
                description: getRepoFullname(swa.repositoryUrl ?? '').name,
            })
        }) ?? new TreeItem(this.resource.name);
    }

    private getSubscription(): ISubscriptionContext {
        const subContext: ISubscriptionContext = {
            subscriptionDisplayName: '',
            subscriptionPath: '',
            tenantId: '',
            userId: '',
            ...this.resource.subscription,
            credentials: {
                getToken: async (scopes?: string | string[]) => {
                    if (typeof scopes === 'string') {
                        scopes = [scopes];
                    } else if (!scopes) {
                        scopes = [];
                    } else {
                        scopes = [...scopes];
                    }

                    if (scopes.find(s => s === 'offline_access') === undefined) {
                        scopes.push('offline_access');
                    }

                    const session = await this.resource.subscription.authentication.getSession(scopes);

                    if (session) {
                        return {
                            token: session.accessToken
                        };
                    } else {
                        return null;
                    }
                },
                signRequest: async () => {
                    throw new Error('TODO: Not yet supported (or localized)');
                }
            }
        };

        return subContext;
    }
}
