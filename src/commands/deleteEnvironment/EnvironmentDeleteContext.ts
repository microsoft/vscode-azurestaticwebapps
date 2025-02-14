/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { StaticSiteBuildARMResource } from "@azure/arm-appservice";
import type { ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { StaticWebAppContext } from "../StaticWebAppContext";

export interface EnvironmentDeleteContext extends StaticWebAppContext, ExecuteActivityContext {
    environmentName: string;
    staticSiteBuild: StaticSiteBuildARMResource;
}
