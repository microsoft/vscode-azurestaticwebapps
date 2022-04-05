/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { GenericTreeItem, IParsedError } from "@microsoft/vscode-azext-utils";
import { TreeItemCollapsibleState } from "vscode";
import { localize } from "../../utils/localize";
import { ActivityBase, ActivityTask, ActivityTreeItemOptions } from "../Activity";

interface DeleteResourceActivityData {
    resourceTypeDisplayName: string;
    resourceName: string;
}

export class DeleteResourceActivity extends ActivityBase<void> {

    public constructor(private readonly data: DeleteResourceActivityData, task: ActivityTask<void>) {
        super(task);
    }

    public inital(): ActivityTreeItemOptions {
        return {
            label: localize('deletingResource', 'Deleting {0} "{1}"', this.data.resourceTypeDisplayName, this.data.resourceName),
        }
    }

    public onSuccess(): ActivityTreeItemOptions {
        return {
            label: this.labelOnDone,
            collapsibleState: TreeItemCollapsibleState.None,
        }
    }

    public onError(error: IParsedError): ActivityTreeItemOptions {
        return {
            label: this.labelOnDone,
            children: (parent) => {
                return [
                    new GenericTreeItem(parent, {
                        contextValue: 'deleteError',
                        label: error.message
                    })
                ];
            }
        }
    }

    private get labelOnDone(): string {
        return localize('deleteResource', 'Delete {0} "{1}"', this.data.resourceTypeDisplayName, this.data.resourceName);
    }
}
