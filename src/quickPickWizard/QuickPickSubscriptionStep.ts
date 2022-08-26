import { AzureWizardPromptStep, IAzureQuickPickItem } from "@microsoft/vscode-azext-utils";
import { AzureExtensionApiProvider } from "@microsoft/vscode-azext-utils/api";
import * as vscode from 'vscode';
import { AzureAccountExtensionApi } from "../azure-account.api";
import { ApplicationSubscription, ResourceModelBase } from "../vscode-azureresourcegroups.api.v2";
import { QuickPickAppResourceWizardContext } from "./QuickPickAppResourceWizardContext";

export class QuickPickSubscriptionStep extends AzureWizardPromptStep<QuickPickAppResourceWizardContext<ResourceModelBase>> {
    private api: AzureAccountExtensionApi;
    public async prompt(wizardContext: QuickPickAppResourceWizardContext<ResourceModelBase>): Promise<void> {
        const session = await vscode.authentication.getSession('microsoft', ['https://management.azure.com/.default', 'offline_access'], { createIfNone: true });

        await this.getApi();
        const subscriptions: ApplicationSubscription[] = this.api.filters.map(subscription => ({
            authentication: {
                getSession: () => session
            },
            displayName: subscription.subscription.displayName || 'TODO: ever undefined?',
            environment: subscription.session.environment,
            isCustomCloud: subscription.session.environment.name === 'AzureCustomCloud',
            subscriptionId: subscription.subscription.subscriptionId || 'TODO: ever undefined?',
        }));

        if (subscriptions.length === 1) {
            wizardContext.applicationSubscription = subscriptions[0];
            return;
        }

        const picks: IAzureQuickPickItem<ApplicationSubscription>[] = subscriptions.map(subscription => ({
            data: subscription,
            label: subscription.displayName
        }))

        const selected = await wizardContext.ui.showQuickPick(picks, {});
        wizardContext.applicationSubscription = selected.data;
    }

    public shouldPrompt(): boolean {
        return true;
    }

    private async getApi(): Promise<AzureAccountExtensionApi | undefined> {
        if (!this.api) {
            const extension = vscode.extensions.getExtension<AzureExtensionApiProvider>('ms-vscode.azure-account');

            if (extension) {
                if (!extension.isActive) {
                    await extension.activate();
                }

                this.api = extension.exports.getApi<AzureAccountExtensionApi>('1');

                if (this.api) {
                    await this.api.waitForFilters();
                }
            }
        }

        return this.api;
    }
}
