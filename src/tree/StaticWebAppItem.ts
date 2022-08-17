import { StaticSiteARMResource, WebSiteManagementClient } from "@azure/arm-appservice";
import { getResourceGroupFromId, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { callWithTelemetryAndErrorHandling, IActionContext, nonNullProp, openUrl } from "@microsoft/vscode-azext-utils";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { ISubscriptionContext } from "vscode-azureextensiondev";
import { createWebSiteClient } from "../utils/azureClients";
import { getRepoFullname } from "../utils/gitUtils";
import { ApplicationResource, ResourceQuickPickOptions } from "../vscode-azureresourcegroups.api.v2";
import { EnvironmentItem } from "./EnvironmentItem";
import { StaticWebAppModel } from "./StaticWebAppModel";

export class StaticWebAppItem implements StaticWebAppModel {

    private readonly resourceGroup: string;
    private swa?: StaticSiteARMResource;

    constructor(private readonly resource: ApplicationResource) {
        this.resourceGroup = getResourceGroupFromId(resource.id);
    }

    contextValues: string[] = ['azureStaticWebApp'];

    quickPickOptions?: ResourceQuickPickOptions | undefined;
    azureResourceId?: string | undefined;

    async getChildren(): Promise<StaticWebAppModel[]> {
        return await callWithTelemetryAndErrorHandling(
            'getChildren',
            async (context: IActionContext) => {
                const client: WebSiteManagementClient = await createWebSiteClient([context, this.getSubscription()]);
                const envs = await uiUtils.listAllIterator(client.staticSites.listStaticSiteBuilds(this.resourceGroup, this.resource.name));
                return envs.map((env) => new EnvironmentItem(env));
            }) ?? [];
    }

    async getTreeItem(): Promise<TreeItem> {

        return await callWithTelemetryAndErrorHandling<TreeItem>('getTreeItem', async (context) => {

            const client = await createWebSiteClient({ ...context, ...this.getSubscription() });
            const swa = await client.staticSites.getStaticSite(getResourceGroupFromId(nonNullProp(this.resource, 'id')), nonNullProp(this.resource, 'name'));
            this.swa = swa;

            return Promise.resolve({
                label: swa.name,
                description: getRepoFullname(swa.repositoryUrl ?? '').name,
                collapsibleState: TreeItemCollapsibleState.Collapsed
            })
        }) ?? new TreeItem(this.resource.name);
    }

    public async browse(): Promise<void> {
        if (this.swa) {
            await openUrl(`https://${this.swa.defaultHostname}`);
        }
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
