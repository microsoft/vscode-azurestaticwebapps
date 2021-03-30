/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ReposGetResponseData } from '@octokit/types';
import { MessageItem, window } from 'vscode';
import { IActionContext, ICreateChildImplContext } from 'vscode-azureextensionui';
import { showActionsMsg } from '../../constants';
import { ext } from '../../extensionVariables';
import { LocalProjectTreeItem } from '../../tree/localProject/LocalProjectTreeItem';
import { StaticWebAppTreeItem } from '../../tree/StaticWebAppTreeItem';
import { SubscriptionTreeItem } from '../../tree/SubscriptionTreeItem';
import { tryGetRemote } from '../../utils/gitHubUtils';
import { localize } from '../../utils/localize';
import { getSingleRootFsPath } from '../../utils/workspaceUtils';
import { showActions } from '../github/showActions';
import { gitPull } from '../gitPull';
import { CreateScenario } from './CreateScenarioListStep';
import { IStaticWebAppWizardContext } from './IStaticWebAppWizardContext';
import { postCreateStaticWebApp } from './postCreateStaticWebApp';

export async function createStaticWebApp(context: IActionContext & Partial<ICreateChildImplContext> & Partial<IStaticWebAppWizardContext>, node?: SubscriptionTreeItem): Promise<StaticWebAppTreeItem> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<SubscriptionTreeItem>(SubscriptionTreeItem.contextValue, context);
    }

    const swaNode: StaticWebAppTreeItem = await node.createChild(context);

    const createdSs: string = localize('createdSs', 'Successfully created new static web app "{0}".  GitHub Actions is building and deploying your app, it will be available once the deployment completes.', swaNode.name);
    ext.outputChannel.appendLog(createdSs);

    const viewOutput: MessageItem = { title: localize('viewOutput', 'View Output') };
    // don't wait
    void window.showInformationMessage(createdSs, showActionsMsg, viewOutput).then(async (result) => {
        if (result === showActionsMsg) {
            await showActions(context, swaNode);
        } else if (result === viewOutput) {
            ext.outputChannel.show();
        }
    });

    const workspacePath: string | undefined = getSingleRootFsPath();
    if (workspacePath) {
        const repoData: ReposGetResponseData | undefined = await tryGetRemote(context, workspacePath);
        if (repoData?.html_url === swaNode.repositoryUrl) {
            const buildConfigCreated: string = localize('buildConfigCreated', 'A build configuration file has automatically been created. Run "git pull" to get the latest changes.', swaNode.name);
            ext.outputChannel.appendLog(buildConfigCreated);

            const gitPullMessage: MessageItem = { title: localize('gitPull', 'git pull') };
            void window.showInformationMessage(buildConfigCreated, gitPullMessage).then(async (result) => {
                if (result === gitPullMessage) {
                    await gitPull(workspacePath);
                }
            });
        }
    }

    void postCreateStaticWebApp(swaNode);

    return swaNode;
}

export async function createStaticWebAppAdvanced(context: IActionContext, node?: SubscriptionTreeItem): Promise<StaticWebAppTreeItem> {
    return await createStaticWebApp({ ...context, advancedCreation: true }, node);
}

export async function createStaticWebAppFromLocalProject(context: IActionContext, localProjectTreeItem: LocalProjectTreeItem): Promise<StaticWebAppTreeItem> {
    const localProjectPath: string = localProjectTreeItem.projectPath;
    const createScenario: CreateScenario = await tryGetRemote(context, localProjectPath) ? 'connectToExistingRepo' : 'publishToNewRepo';
    const swaTreeItem: StaticWebAppTreeItem = await createStaticWebApp({ ...context, fsPath: localProjectPath, createScenario });
    await localProjectTreeItem.refresh(context);
    return swaTreeItem;
}
