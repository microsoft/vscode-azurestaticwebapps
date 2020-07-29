/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as moment from 'moment';
import { AzureTreeItem, TreeItemIconPath } from "vscode-azureextensionui";
import { ActionWorkflowStepData, Conclusion, Status } from '../gitHubTypings';
import { convertConclusionToVerb, convertStatusToVerb, ensureConclusion, ensureStatus } from '../utils/actionUtils';
import { localize } from '../utils/localize';
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
        return treeUtils.getActionIconPath(this._status, this._conclusion);
    }

    public get id(): string {
        return this.data.number.toString();
    }

    public get name(): string {
        return this.data.name;
    }

    public get label(): string {
        return this.name;
    }

    public get description(): string {
        if (this.data.conclusion !== null) {
            return localize('conclusionDescription', '{0} {1}', convertConclusionToVerb(this._conclusion), moment(this._completedDate).fromNow());
        } else {
            const nowStr: string = localize('now', 'now');
            return localize('statusDescription', '{0} {1}', convertStatusToVerb(this._status), this._startedDate.getTime() === 0 ? nowStr : moment(this._startedDate).fromNow());
        }
    }

    private get _startedDate(): Date {
        return new Date(this.data.started_at);
    }

    private get _completedDate(): Date {
        return new Date(this.data.completed_at);
    }

    private get _status(): Status {
        return ensureStatus(this.data.status);
    }

    private get _conclusion(): Conclusion {
        return ensureConclusion(this.data.conclusion);
    }
}
