import { StaticSiteBuildARMResource } from "@azure/arm-appservice";
import { openUrl } from "@microsoft/vscode-azext-utils";
import { ProviderResult, TreeItem } from "vscode";
import { productionEnvironmentName } from "../constants";
import { localize } from "../utils/localize";
import { treeUtils } from "../utils/treeUtils";
import { ResourceQuickPickOptions } from "../vscode-azureresourcegroups.api.v2";
import { StaticWebAppModel } from "./StaticWebAppModel";

export class EnvironmentItem implements StaticWebAppModel {
    constructor(private readonly environment: StaticSiteBuildARMResource) { }
    contextValues: string[] = ['azureStaticEnvironment'];
    quickPickOptions?: ResourceQuickPickOptions | undefined;
    azureResourceId?: string | undefined;

    getChildren(): ProviderResult<StaticWebAppModel[]> {
        throw new Error("Method not implemented.");
    }

    getTreeItem(): TreeItem {
        return {
            iconPath: treeUtils.getIconPath('azure-staticwebapps'),
            label: this.environment.buildId === 'default' ? productionEnvironmentName : `${this.environment.pullRequestTitle}`,
            description: this.description,
        }
    }

    private get description(): string | undefined {
        if (this.environment.status !== 'Ready') {
            // if the environment isn't ready, the status has priority over displaying its linked
            return localize('statusTag', '{0} ({1})', this.environment.sourceBranch, this.environment.status);
        }

        return undefined;
    }

    public async browse(): Promise<void> {
        await openUrl(`https://${this.environment.hostname}`);
    }
}
