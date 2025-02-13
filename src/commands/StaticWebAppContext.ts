/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { StaticWebAppModel } from "../tree/v2/StaticWebAppItem";

export interface StaticWebAppContext extends ISubscriptionActionContext {
    subscription: AzureSubscription;
    staticWebApp?: StaticWebAppModel;
}
