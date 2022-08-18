/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzExtResourceType } from "@microsoft/vscode-azext-utils";
import { ApplicationResource, Filter } from "./vscode-azureresourcegroups.api.v2";

export class AppResourceFilter implements Filter<ApplicationResource> {
    constructor(private readonly azExtResourceType: AzExtResourceType) { }

    public matches(resource: ApplicationResource): boolean {
        return this.azExtResourceType === resource.azExtResourceType;
    }
}
