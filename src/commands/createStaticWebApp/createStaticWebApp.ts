/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ProgressLocation, ProgressOptions, window } from 'vscode';
import { IActionContext, ICreateChildImplContext } from 'vscode-azureextensionui';
import { productionEnvironmentName } from '../../constants';
import { VerifyingWorkspaceError } from '../../errors';
import { ext } from '../../extensionVariables';
import { DetectorResults, NodeDetector } from '../../NodeDetector';
import { EnvironmentTreeItem } from '../../tree/EnvironmentTreeItem';
import { StaticWebAppTreeItem } from '../../tree/StaticWebAppTreeItem';
import { SubscriptionTreeItem } from '../../tree/SubscriptionTreeItem';
import { localize } from '../../utils/localize';
import { findSubFolders, showNoWorkspacePrompt, tryGetWorkspaceFolder } from '../../utils/workspaceUtils';
import { showSwaCreated } from '../showSwaCreated';
import { IStaticWebAppWizardContext } from './IStaticWebAppWizardContext';
import { postCreateStaticWebApp } from './postCreateStaticWebApp';
import { setWorkspaceContexts } from './setWorkspaceContexts';
import { tryGetApiLocations } from './tryGetApiLocations';

let isVerifyingWorkspace: boolean = false;
export async function createStaticWebApp(context: IActionContext & Partial<ICreateChildImplContext> & Partial<IStaticWebAppWizardContext>, node?: SubscriptionTreeItem): Promise<StaticWebAppTreeItem> {
    if (isVerifyingWorkspace) {
        throw new VerifyingWorkspaceError(context);
    }

    const progressOptions: ProgressOptions = {
        location: ProgressLocation.Window,
        title: localize('verifyingWorkspace', 'Verifying workspace...')
    };

    isVerifyingWorkspace = true;
    try {
        if (!node) {
            node = await ext.tree.showTreeItemPicker<SubscriptionTreeItem>(SubscriptionTreeItem.contextValue, context);
        }

        await window.withProgress(progressOptions, async () => {
            const folder = await tryGetWorkspaceFolder(context);
            if (folder) {

                const fsPaths = await findSubFolders(folder);
                // look for frameworks in subfolders as well
                const detectedFrameworks: DetectorResults[] = [];
                for (const fsPath of fsPaths) {
                    const result = await new NodeDetector().detect(fsPath);
                    if (result) { detectedFrameworks.push(result); }
                }
                // comma separated list of all frameworks detected in this project
                context.telemetry.properties.detectedFrameworks = detectedFrameworks.filter(df => df.frameworks.length > 0).map(dr => dr.frameworks.map(fi => fi.framework)).join(', ');

                await setWorkspaceContexts(context, folder);
                context.detectedApiLocations = await tryGetApiLocations(context, folder);
            } else {
                await showNoWorkspacePrompt(context);
            }
        });
    } finally {
        isVerifyingWorkspace = false;
    }

    const swaNode: StaticWebAppTreeItem = await node.createChild(context);
    void showSwaCreated(swaNode);

    // only reveal SWA node when tree is visible to avoid changing their tree view just to reveal the node
    if (ext.treeView.visible) {
        const environmentNode: EnvironmentTreeItem | undefined = <EnvironmentTreeItem | undefined>(await swaNode.loadAllChildren(context)).find(ti => {
            return ti instanceof EnvironmentTreeItem && ti.label === productionEnvironmentName;
        });
        environmentNode && await ext.treeView.reveal(environmentNode, { expand: true });
    }

    void postCreateStaticWebApp(swaNode);
    return swaNode;
}

export async function createStaticWebAppAdvanced(context: IActionContext, node?: SubscriptionTreeItem): Promise<StaticWebAppTreeItem> {
    return await createStaticWebApp({ ...context, advancedCreation: true }, node);
}
