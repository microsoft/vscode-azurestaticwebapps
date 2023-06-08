/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ExecuteActivityContext, IActionContext, ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { ResolvedStaticWebAppTreeItem } from "../../tree/StaticWebAppTreeItem";

export interface IDeleteWizardContext extends IActionContext, ExecuteActivityContext {
    node?: ResolvedStaticWebAppTreeItem;
    resourceGroupToDelete?: string;
    subscription: ISubscriptionContext;
}
