/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzExtParentTreeItem, AzExtTreeItem, IParsedError, parseError } from "@microsoft/vscode-azext-utils";
import { randomUUID } from "crypto";
import { TreeItemCollapsibleState } from "vscode";

export interface ActivityTreeItemOptions {
    label: string;
    contextValuePostfix?: string;
    collapsibleState?: TreeItemCollapsibleState;
    children?: (parent: AzExtParentTreeItem) => AzExtTreeItem[];
}

interface ActivityType {
    inital(): ActivityTreeItemOptions;
    onSuccess(): ActivityTreeItemOptions;
    onError(error: IParsedError): ActivityTreeItemOptions;
}

export type ActivityTask<R = void> = R extends void ? () => Promise<void> : () => Promise<R | undefined>;

export abstract class ActivityBase<R = void> implements ActivityType {

    abstract inital(): ActivityTreeItemOptions;
    abstract onSuccess(): ActivityTreeItemOptions;
    abstract onError(error: IParsedError): ActivityTreeItemOptions;

    public id: string;
    public done: boolean;
    public error?: IParsedError;
    public readonly task: () => Promise<R | undefined>;
    public startedAtMs: number;

    public constructor(task: () => Promise<R | undefined>) {
        this.id = randomUUID();
        this.done = false;
        this.startedAtMs = Date.now();
        this.task = task;
    }

    public async run(): Promise<R | undefined> {
        try {
            return await this.task();
        } catch (e) {
            this.error = parseError(e);
        } finally {
            this.done = true;
        }
        return undefined;
    }

    public get state(): ActivityTreeItemOptions {
        if (this.done) {
            return this.error ? this.onError(this.error) : this.onSuccess();
        }
        return this.inital();
    }
}
