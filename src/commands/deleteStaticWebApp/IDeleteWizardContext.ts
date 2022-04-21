/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ExecuteActivityContext, IActionContext } from "@microsoft/vscode-azext-utils";
import { ISubscriptionContext } from "vscode-azureextensiondev";
import { ResolvedStaticWebAppTreeItem } from "../../tree/StaticWebAppTreeItem";

export interface IDeleteWizardContext extends IActionContext, ExecuteActivityContext {
    node?: ResolvedStaticWebAppTreeItem;
    resourceGroupToDelete?: string;
    subscription: ISubscriptionContext;
}
