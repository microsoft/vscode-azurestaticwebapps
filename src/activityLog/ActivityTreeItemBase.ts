/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzExtParentTreeItem, AzExtTreeItem, IActionContext, TreeItemIconPath } from "@microsoft/vscode-azext-utils";
import { ThemeColor, ThemeIcon, TreeItemCollapsibleState } from "vscode";
import { localize } from "../utils/localize";
import { ActivityBase } from "./Activity";

export class ActivityTreeItem extends AzExtParentTreeItem {

    public constructor(parent: AzExtParentTreeItem, public readonly activity: ActivityBase) {
        super(parent);
    }

    public get id(): string | undefined {
        return this.activity.id;
    }

    public get contextValue(): string {
        const postfix = this.activity.state.contextValuePostfix ? `.${this.activity.state.contextValuePostfix}` : '';
        return `azureOperation.${this.activity.done ? this.activity.error ? 'failed' : 'succeeded' : 'running'}${postfix}`;
    }

    public get collapsibleState(): TreeItemCollapsibleState {
        return this.activity.state.collapsibleState ?? this.activity.done ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None;
    }

    public set collapsibleState(_value: TreeItemCollapsibleState) {
        // no-op
    }

    public get label(): string {
        return this.activity.state.label;
    }

    public get description(): string | undefined {
        return this.stateValue({
            running: undefined,
            succeeded: localize('succeded', 'Succeeded'),
            failed: localize('failed', 'Failed'),
        });
    }

    public get iconPath(): TreeItemIconPath | undefined {
        return this.stateValue({
            running: new ThemeIcon('loading~spin'),
            succeeded: new ThemeIcon('pass', new ThemeColor('testing.iconPassed')),
            failed: new ThemeIcon('error', new ThemeColor('testing.iconFailed')),
        });
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, _context: IActionContext): Promise<AzExtTreeItem[]> {
        if (this.activity.state.children) {
            return this.activity.state.children(this);
        }
        return [];
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    private stateValue<T>(values: { running: T, succeeded: T, failed: T }): T {
        if (this.activity.done) {
            return this.activity.error ? values.failed : values.succeeded;
        }
        return values.running;
    }
}
