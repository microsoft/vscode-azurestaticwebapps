/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { GenericTreeItem, IParsedError, parseError } from "@microsoft/vscode-azext-utils";
import { TreeItemCollapsibleState } from "vscode";
import { AppResource } from "../../api";
import { localize } from "../../utils/localize";
import { treeUtils } from "../../utils/treeUtils";
import { ActivityBase, ActivityTask, ActivityTreeItemOptions } from "../Activity";

interface CreateResourceActivityData {
    resourceTypeDisplayName: string;
    resourceName: string;
}

export class CreateResourceActivity extends ActivityBase<AppResource> {

    private result?: AppResource;

    public constructor(private readonly data: CreateResourceActivityData, task: ActivityTask<AppResource>) {
        super(task);
    }

    public async run(): Promise<AppResource | undefined> {
        try {
            this.result = await this.task();
            return this.result;
        } catch (e) {
            this.error = parseError(e);
        } finally {
            this.done = true;
        }
        return undefined;
    }

    public inital(): ActivityTreeItemOptions {
        return {
            label: localize('creatingResource', 'Creating {0} "{1}"', this.data.resourceTypeDisplayName, this.data.resourceName),
        }
    }

    public onSuccess(): ActivityTreeItemOptions {
        return {
            label: this.labelOnDone,
            collapsibleState: TreeItemCollapsibleState.Expanded,
            children: (parent) => {
                const ti = new GenericTreeItem(parent, {
                    contextValue: 'createResult',
                    label: this.data.resourceName,
                    commandId: 'azureResourceGroups.revealResource',
                    iconPath: treeUtils.getIconPath('azure-staticwebapps')
                });

                ti.commandArgs = [this.result]
                return [ti];
            }
        }
    }

    public onError(error: IParsedError): ActivityTreeItemOptions {
        return {
            label: this.labelOnDone,
            collapsibleState: TreeItemCollapsibleState.Expanded,
            children: (parent) => {
                return [
                    new GenericTreeItem(parent, {
                        contextValue: 'createError',
                        label: error.message
                    })
                ];
            }
        }
    }

    private get labelOnDone(): string {
        return localize('createResource', 'Create {0} "{1}"', this.data.resourceTypeDisplayName, this.data.resourceName);
    }
}
