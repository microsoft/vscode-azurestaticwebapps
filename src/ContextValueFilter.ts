/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Filter, ResourceModelBase } from "./vscode-azureresourcegroups.api.v2";

export class ContextValueFilter implements Filter<ResourceModelBase> {

    constructor(private readonly expectedContextValue: string | RegExp | (string | RegExp)[]) { }

    matches(resource: ResourceModelBase): boolean {

        const filterArray = Array.isArray(this.expectedContextValue) ? this.expectedContextValue : [this.expectedContextValue];

        if (!resource.quickPickOptions) {
            return false;
        }

        return filterArray.some(filter => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return resource.quickPickOptions!.contexts?.some(contextValue => {
                if (typeof filter === 'string') {
                    return filter === contextValue;
                } else {
                    return filter.test(contextValue);
                }
            })
        });
    }
}
