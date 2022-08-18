/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ExecuteActivityContext, IActionContext } from "@microsoft/vscode-azext-utils";
import { ISubscriptionContext } from "vscode-azureextensiondev";
import { StaticWebAppItem } from "../../tree/StaticWebAppItem";

export interface IDeleteWizardContextV2 extends IActionContext, ExecuteActivityContext {
    node?: StaticWebAppItem;
    resourceGroupToDelete?: string;
    subscription: ISubscriptionContext;
}
