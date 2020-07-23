/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as moment from 'moment';
import * as prettyMs from 'pretty-ms';
import { AzureTreeItem, TreeItemIconPath } from "vscode-azureextensionui";
import { Conclusion, Status } from '../constants';
import { ActionWorkflowStepData } from '../gitHubTypings';
import { convertConclusionToVerb, convertStatusToVerb } from '../utils/gitHubUtils';
import { treeUtils } from "../utils/treeUtils";
import { IAzureResourceTreeItem } from './IAzureResourceTreeItem';
import { JobTreeItem } from './JobTreeItem';

export class StepTreeItem extends AzureTreeItem implements IAzureResourceTreeItem {

    public static contextValue: string = 'azureStaticStep';
    public readonly contextValue: string = StepTreeItem.contextValue;
    public parent: JobTreeItem;
    public data: ActionWorkflowStepData;

    constructor(parent: JobTreeItem, data: ActionWorkflowStepData) {
        super(parent);
        this.data = data;
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getActionIconPath(<Status>this.data.status, <Conclusion>this.data.conclusion);
    }

    public get id(): string {
        return `${this.parent.id}/${this.data.name}`;
    }

    public get name(): string {
        return this.data.name;
    }

    public get label(): string {
        return this.name;
    }

    public get description(): string {
        if (this.data.conclusion !== null) {
            const elapsedMs: number = this.completedDate.getTime() - this.startedDate.getTime();
            return `${convertConclusionToVerb(<Conclusion>this.data.conclusion)} in ${prettyMs(elapsedMs)}`;
        } else {
            return `${convertStatusToVerb(<Status>this.data.status)} ${this.startedDate.getTime() === 0 ? '' : moment(this.startedDate).fromNow()}`;
        }
    }

    private get startedDate(): Date {
        return new Date(this.data.started_at);
    }

    private get completedDate(): Date {
        return new Date(this.data.completed_at);
    }
}
