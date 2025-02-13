/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { StaticWebAppModel } from "../../tree/v2/StaticWebAppItem";
import { StaticWebAppContext } from "../StaticWebAppContext";

export interface StaticWebAppDeleteContext extends StaticWebAppContext, ExecuteActivityContext {
    resourceGroupToDelete?: string;
    staticWebApp: StaticWebAppModel; // Require the existing static web app to be provided upfront
}
