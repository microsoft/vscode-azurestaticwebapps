/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtTreeItem, IActionContext, isBox } from "@microsoft/vscode-azext-utils";
import { ext } from "./extensionVariables";
import { branchDataProvider } from "./tree/StaticWebAppBranchDataProvider";
import { StaticWebAppModel } from "./tree/StaticWebAppModel";
import { WrappedResourceModel } from "./vscode-azureresourcegroups.api.v2";

export async function refreshTreeItem(actionContext: IActionContext, node: (AzExtTreeItem) | WrappedResourceModel | StaticWebAppModel | undefined): Promise<void> {
    if (node) {
        if (node instanceof AzExtTreeItem) {
            await ext.rgApi.appResourceTree.refresh(actionContext, node);
        } else {

            const resourceModel = isBox(node) ? await node.unwrap<StaticWebAppModel>() : node as StaticWebAppModel;

            if (resourceModel) {
                branchDataProvider.refresh(resourceModel);
            }
        }
    }
}
