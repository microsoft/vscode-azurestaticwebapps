/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra, IActionContext, ICreateChildImplContext } from '@microsoft/vscode-azext-utils';
import { ProgressLocation, ProgressOptions, Uri, window } from 'vscode';
import { Utils } from 'vscode-uri';
import { NodeConstants } from '../../detectors/node/nodeConstants';
import { DetectorResults, NodeDetector } from '../../detectors/node/NodeDetector';
import { VerifyingWorkspaceError } from '../../errors';
import { ext } from '../../extensionVariables';
import { SubscriptionTreeItem } from '../../tree/SubscriptionTreeItem';
import { localize } from '../../utils/localize';
import { telemetryUtils } from '../../utils/telemetryUtils';
import { getSubFolders, showNoWorkspacePrompt, tryGetWorkspaceFolder } from '../../utils/workspaceUtils';
import { IStaticWebAppWizardContext } from './IStaticWebAppWizardContext';
import { setWorkspaceContexts } from './setWorkspaceContexts';
import { tryGetApiLocations } from './tryGetApiLocations';

let isVerifyingWorkspace: boolean = false;
export async function createStaticWebApp(context: IActionContext & Partial<ICreateChildImplContext> & Partial<IStaticWebAppWizardContext>, node?: SubscriptionTreeItem): Promise<void> {
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
            node = await ext.rgApi.tree.showTreeItemPicker<SubscriptionTreeItem>(SubscriptionTreeItem.contextValue, context);
        }

        await window.withProgress(progressOptions, async () => {
            const folder = await tryGetWorkspaceFolder(context);
            if (folder) {
                await telemetryUtils.runWithDurationTelemetry(context, 'tryGetFrameworks', async () => {
                    const detector = new NodeDetector();

                    const detectorResult = await detector.detect(folder.uri);
                    // comma separated list of all frameworks detected in this project
                    context.telemetry.properties.detectedFrameworks = `(${detectorResult?.frameworks.map(fi => fi.framework).join('), (')})` ?? 'N/A';
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

    await node.createChildImpl2(context);
    // // ext.rgApi.revealTreeItem()
    // // void showSwaCreated(swaNode);

    // // only reveal SWA node when tree is visible to avoid changing their tree view just to reveal the node
    // if (ext.rgApi.treeView.visible) {
    //     const environmentNode: EnvironmentTreeItem | undefined = <EnvironmentTreeItem | undefined>(await swaNode.loadAllChildren(context)).find(ti => {
    //         return ti instanceof EnvironmentTreeItem && ti.label === productionEnvironmentName;
    //     });
    //     environmentNode && await ext.treeView.reveal(environmentNode, { expand: true });
    // }

    // void postCreateStaticWebApp(swaNode);
    // return swaNode;

    void node.refresh(context);
}

export async function createStaticWebAppAdvanced(context: IActionContext, node?: SubscriptionTreeItem): Promise<void> {
    return await createStaticWebApp({ ...context, advancedCreation: true }, node);
}
