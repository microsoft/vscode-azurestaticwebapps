/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ProgressLocation, ProgressOptions, Uri, window } from 'vscode';
import { AzExtFsExtra, IActionContext, ICreateChildImplContext } from 'vscode-azureextensionui';
import { Utils } from 'vscode-uri';
import { productionEnvironmentName } from '../../constants';
import { NodeConstants } from '../../detectors/node/nodeConstants';
import { DetectorResults, NodeDetector } from '../../detectors/node/NodeDetector';
import { VerifyingWorkspaceError } from '../../errors';
import { ext } from '../../extensionVariables';
import { EnvironmentTreeItem } from '../../tree/EnvironmentTreeItem';
import { StaticWebAppTreeItem } from '../../tree/StaticWebAppTreeItem';
import { SubscriptionTreeItem } from '../../tree/SubscriptionTreeItem';
import { localize } from '../../utils/localize';
import { telemetryUtils } from '../../utils/telemetryUtils';
import { getSubFolders, showNoWorkspacePrompt, tryGetWorkspaceFolder } from '../../utils/workspaceUtils';
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
                await telemetryUtils.runWithDurationTelemetry(context, 'tryGetFrameworks', async () => {
                    const detector = new NodeDetector();

                    const detectorResult = await detector.detect(folder.uri);
                    // comma separated list of all frameworks detected in this project
                    context.telemetry.properties.detectedFrameworks = detectorResult?.frameworks.map(fi => fi.framework).join(', ') ?? 'N/A';
                    context.telemetry.properties.rootHasSrcFolder = (await AzExtFsExtra.pathExists(Uri.joinPath(folder.uri, NodeConstants.srcFolderName))).toString();

                    const subfolderDetectorResults: DetectorResults[] = [];
                    const subWithSrcFolder: string[] = []
                    const subfolders = await getSubFolders(context, folder.uri);
                    for (const subfolder of subfolders) {
                        const subResult = await detector.detect(subfolder);
                        if (subResult) {
                            subfolderDetectorResults.push(subResult);
                            if (await AzExtFsExtra.pathExists(Uri.joinPath(subfolder, NodeConstants.srcFolderName))) {
                                subWithSrcFolder.push(Utils.basename(subfolder));
                            }
                        }
                    }

                    if (subfolderDetectorResults.length > 0) {
                        // example print: "(Angular,Typescript), (Next.js,React), (Nuxt.js), (React), (Svelte), (Vue.js,Vue.js)"
                        context.telemetry.properties.detectedFrameworksSub = `(${subfolderDetectorResults.map(dr => dr.frameworks).map(fis => fis.map(fi => fi.framework)).join('), (')})`;
                        context.telemetry.properties.subFoldersWithSrc = subWithSrcFolder.join(', ');
                    }
                });

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
