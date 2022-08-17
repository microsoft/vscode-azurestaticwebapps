/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AppResourceFilter as AppResourceFilterOptions } from "@microsoft/vscode-azext-utils/hostapi";
import { ApplicationResource, Filter } from "./vscode-azureresourcegroups.api.v2";

export class AppResourceFilter implements Filter<ApplicationResource> {

    constructor(private readonly options: AppResourceFilterOptions) { }

    public matches(resource: ApplicationResource): boolean {
        if (this.options.type !== resource.type.type) {
            return false;
        }

        // if (this.options.kind && this.options.kind !== resource.type.kinds) {
        //     return false;
        // }

        if (this.options.tags) {
            for (const tag of Object.keys(this.options.tags)) {
                if (this.options.tags[tag] !== resource.tags?.[tag]) {
                    return false;
                }
            }
        }

        return true;
    }
}
