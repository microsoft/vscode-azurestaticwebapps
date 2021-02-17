/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { pathExists } from 'fs-extra';
import { join } from 'path';
import { Disposable, workspace } from 'vscode';
import { AzExtTreeItem, AzureAccountTreeItemBase, callWithTelemetryAndErrorHandling, IActionContext, ISubscriptionContext } from 'vscode-azureextensionui';
import { apiSubpathSetting, appArtifactSubpathSetting, appSubpathSetting, configFileName, outputSubpathSetting } from '../constants';
import { ext } from '../extensionVariables';
import { createRefreshFileWatcher } from './localProject/createRefreshFileWatcher';
import { LocalProjectTreeItem } from './localProject/LocalProjectTreeItem';
import { SubscriptionTreeItem } from './SubscriptionTreeItem';

export class AzureAccountTreeItemWithProject extends AzureAccountTreeItemBase {
    private _projectDisposables: Disposable[] = [];

    public constructor(testAccount?: {}) {
        super(undefined, testAccount);
        this.disposables.push(workspace.onDidChangeWorkspaceFolders(async () => {
            await callWithTelemetryAndErrorHandling('AzureAccountTreeItemWithProject.onDidChangeWorkspaceFolders', async (context: IActionContext) => {
                context.errorHandling.suppressDisplay = true;
                context.telemetry.suppressIfSuccessful = true;
                await this.refresh(context);
            });
        }));
        this.disposables.push(workspace.onDidChangeConfiguration(async event => {
            await callWithTelemetryAndErrorHandling('AzureAccountTreeItemWithProject.onDidChangeConfiguration', async (context: IActionContext) => {
                context.errorHandling.suppressDisplay = true;
                context.telemetry.suppressIfSuccessful = true;
                const settings: string[] = [appSubpathSetting, apiSubpathSetting, appArtifactSubpathSetting, outputSubpathSetting];
                if (settings.some(s => event.affectsConfiguration(`${ext.prefix}.${s}`))) {
                    await this.refresh(context);
                }
            });
        }));
    }

    public dispose(): void {
        super.dispose();
        Disposable.from(...this._projectDisposables).dispose();
    }

    public createSubscriptionTreeItem(root: ISubscriptionContext): SubscriptionTreeItem {
        return new SubscriptionTreeItem(this, root);
    }

    public async loadMoreChildrenImpl(clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        const children: AzExtTreeItem[] = await super.loadMoreChildrenImpl(clearCache, context);

        Disposable.from(...this._projectDisposables).dispose();
        this._projectDisposables = [];

        const workspaceFolderPath: string | undefined = workspace.workspaceFolders ? workspace.workspaceFolders[0].uri.fsPath : undefined;
        if (workspaceFolderPath) {
            const configFilePathExists: boolean = await pathExists(join(workspaceFolderPath, configFileName));
            if (configFilePathExists) {
                const localProjectTreeItem: LocalProjectTreeItem = new LocalProjectTreeItem(this, workspaceFolderPath);
                children.push(localProjectTreeItem);

                this._projectDisposables.push(localProjectTreeItem);
                this._projectDisposables.push(createRefreshFileWatcher(this, join(workspaceFolderPath, configFileName)));
            }
        }

        return children;
    }

    public compareChildrenImpl(item1: AzExtTreeItem, item2: AzExtTreeItem): number {
        if (item1 instanceof LocalProjectTreeItem && !(item2 instanceof LocalProjectTreeItem)) {
            return 1;
        } else if (!(item1 instanceof LocalProjectTreeItem) && item2 instanceof LocalProjectTreeItem) {
            return -1;
        } else {
            return super.compareChildrenImpl(item1, item2);
        }
    }
}
