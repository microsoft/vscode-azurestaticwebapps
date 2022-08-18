import { StaticSiteARMResource, WebSiteManagementClient } from "@azure/arm-appservice";
import { getResourceGroupFromId, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, callWithTelemetryAndErrorHandling, IActionContext, nonNullProp, openUrl } from "@microsoft/vscode-azext-utils";
import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode";
import { ISubscriptionContext } from "vscode-azureextensiondev";
import { ConfirmDeleteStep } from "../commands/deleteStaticWebApp/ConfirmDeleteStep";
import { DeleteResourceGroupStep } from "../commands/deleteStaticWebApp/DeleteResourceGroupStep";
import { IDeleteWizardContextV2 } from "../commands/deleteStaticWebApp/IDeleteWizardContextv2";
import { StaticWebAppDeleteStep } from "../commands/deleteStaticWebApp/StaticWebAppDeleteStep";
import { refreshTreeItem } from "../refreshTreeItem";
import { createActivityContext } from "../utils/activityUtils";
import { createWebSiteClient } from "../utils/azureClients";
import { getRepoFullname } from "../utils/gitUtils";
import { localize } from "../utils/localize";
import { createSubscriptionContext } from "../utils/v2/credentialsUtils";
import { ApplicationResource, ResourceQuickPickOptions } from "../vscode-azureresourcegroups.api.v2";
import { EnvironmentItem } from "./EnvironmentItem";
import { StaticWebAppModel } from "./StaticWebAppModel";

export class StaticWebAppItem implements StaticWebAppModel {

    public readonly resourceGroup: string;
    private swa?: StaticSiteARMResource;
    contextValues: string[] = ['azureStaticWebApp'];
    quickPickOptions?: ResourceQuickPickOptions | undefined;
    azureResourceId?: string | undefined;

    constructor(private readonly resource: ApplicationResource) {
        this.resourceGroup = getResourceGroupFromId(resource.id);
    }

    public get name(): string {
        return this.resource.name;
    }

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

            const ti: TreeItem = {
                label: swa.name,
                description: getRepoFullname(swa.repositoryUrl ?? '').name,
                collapsibleState: TreeItemCollapsibleState.Collapsed,
                ...this.temporaryTreeItem
            };

            return ti;

        }) ?? new TreeItem(this.resource.name);
    }

    public async delete(context: IActionContext): Promise<void> {
        const wizardContext: IDeleteWizardContextV2 = {
            ...context,
            node: this,
            subscription: this.getSubscription(),
            ...(await createActivityContext())
        };

        const wizard = new AzureWizard<IDeleteWizardContextV2>(wizardContext, {
            title: localize('deleteSwa', 'Delete Static Web App "{0}"', this.resource.name),
            promptSteps: [new ConfirmDeleteStep()],
            executeSteps: [new StaticWebAppDeleteStep(), new DeleteResourceGroupStep()]
        });

        await wizard.prompt();

        await this.runWithTemporaryTreeItem(
            context,
            {
                description: 'Deleting...',
                iconPath: new ThemeIcon('loading~spin')
            },
            async () => {
                await wizard.execute();
            }
        );
    }

    public async browse(): Promise<void> {
        if (this.swa) {
            await openUrl(`https://${this.swa.defaultHostname}`);
        }
    }

    private temporaryTreeItem?: Partial<TreeItem>;
    private async runWithTemporaryTreeItem(context: IActionContext, treeItem: Partial<TreeItem>, callback: () => Promise<void>) {
        this.temporaryTreeItem = treeItem;
        await refreshTreeItem(context, this);
        await callback();
        this.temporaryTreeItem = undefined;
        await refreshTreeItem(context, this);
    }

    private getSubscription(): ISubscriptionContext {
        return createSubscriptionContext(this.resource.subscription);
    }
}
