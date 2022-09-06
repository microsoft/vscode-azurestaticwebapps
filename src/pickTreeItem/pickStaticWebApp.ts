import { appResourceExperience, AzExtResourceType, IActionContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../extensionVariables";
import { StaticWebAppModel } from "../tree/StaticWebAppModel";

export async function pickStaticWebApp<TModel extends StaticWebAppModel>(context: IActionContext, childFilter?: Parameters<typeof appResourceExperience>['3']): Promise<TModel> {
    return appResourceExperience(context, ext.rgApiv2.getResourceGroupsTreeDataProvider(), AzExtResourceType.StaticWebApps, childFilter);
}
