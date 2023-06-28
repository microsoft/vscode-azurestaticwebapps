/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { StaticSiteARMResource, WebSiteManagementClient } from '@azure/arm-appservice';
import { LocationListStep, ResourceGroupCreateStep, ResourceGroupListStep, SubscriptionTreeItemBase, VerifyProvidersStep } from '@microsoft/vscode-azext-azureutils';
import { AzExtFsExtra, AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, ExecuteActivityContext, IActionContext, ICreateChildImplContext, nonNullProp } from '@microsoft/vscode-azext-utils';
import { AppResource } from '@microsoft/vscode-azext-utils/hostapi';
import { ProgressLocation, ProgressOptions, Uri, window, workspace } from 'vscode';
import { Utils } from 'vscode-uri';
import { StaticWebAppResolver } from '../../StaticWebAppResolver';
import { DetectorResults, NodeDetector } from '../../detectors/node/NodeDetector';
import { NodeConstants } from '../../detectors/node/nodeConstants';
import { VerifyingWorkspaceError } from '../../errors';
import { ext } from '../../extensionVariables';
import { createActivityContext } from '../../utils/activityUtils';
import { createWebSiteClient } from '../../utils/azureClients';
import { getGitHubAccessToken } from '../../utils/gitHubUtils';
import { gitPull } from '../../utils/gitUtils';
import { localize } from '../../utils/localize';
import { telemetryUtils } from '../../utils/telemetryUtils';
import { getSingleRootFsPath, getSubFolders, showNoWorkspacePrompt, tryGetWorkspaceFolder } from '../../utils/workspaceUtils';
import { RemoteShortnameStep } from '../createRepo/RemoteShortnameStep';
import { RepoCreateStep } from '../createRepo/RepoCreateStep';
import { RepoNameStep } from '../createRepo/RepoNameStep';
import { RepoPrivacyStep } from '../createRepo/RepoPrivacyStep';
import { showSwaCreated } from '../showSwaCreated';
import { ApiLocationStep } from './ApiLocationStep';
import { AppLocationStep } from './AppLocationStep';
import { BuildPresetListStep } from './BuildPresetListStep';
import { GitHubOrgListStep } from './GitHubOrgListStep';
import { IStaticWebAppWizardContext } from './IStaticWebAppWizardContext';
import { OutputLocationStep } from './OutputLocationStep';
import { SkuListStep } from './SkuListStep';
import { StaticWebAppCreateStep } from './StaticWebAppCreateStep';
import { StaticWebAppNameStep } from './StaticWebAppNameStep';
import { setGitWorkspaceContexts } from './setWorkspaceContexts';
import { tryGetApiLocations } from './tryGetApiLocations';

function isSubscription(item?: SubscriptionTreeItemBase): item is SubscriptionTreeItemBase {
    try {
        // Accessing item.subscription throws an error for some workspace items
        // see https://github.com/microsoft/vscode-azurefunctions/issues/3731
        return !!item && !!item.subscription;
    } catch {
        return false;
    }
}

let isVerifyingWorkspace: boolean = false;
export async function createStaticWebApp(context: IActionContext & Partial<ICreateChildImplContext> & Partial<IStaticWebAppWizardContext>, node?: SubscriptionTreeItemBase): Promise<AppResource> {
    if (isVerifyingWorkspace) {
        throw new VerifyingWorkspaceError(context);
    }

    const progressOptions: ProgressOptions = {
        location: ProgressLocation.Window,
        title: localize('verifyingWorkspace', 'Verifying workspace...')
    };

    isVerifyingWorkspace = true;
    try {
        if (!isSubscription(node)) {
            node = await ext.rgApi.appResourceTree.showTreeItemPicker<SubscriptionTreeItemBase>(SubscriptionTreeItemBase.contextValue, context);
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

                await setGitWorkspaceContexts(context, folder);
                context.detectedApiLocations = await tryGetApiLocations(context, folder);
            } else {
                await showNoWorkspacePrompt(context);
            }
        });
    } finally {
        isVerifyingWorkspace = false;
    }
    const client: WebSiteManagementClient = await createWebSiteClient([context, node.subscription]);
    const wizardContext: IStaticWebAppWizardContext = {
        accessToken: await getGitHubAccessToken(),
        client,
        ...context,
        ...node.subscription,
        ...(await createActivityContext())
    };

    const title: string = localize('createStaticApp', 'Create Static Web App');
    const promptSteps: AzureWizardPromptStep<IStaticWebAppWizardContext & ExecuteActivityContext>[] = [];
    const executeSteps: AzureWizardExecuteStep<IStaticWebAppWizardContext>[] = [];

    if (!context.advancedCreation) {
        wizardContext.sku = SkuListStep.getSkus()[0];
        executeSteps.push(new ResourceGroupCreateStep());
    } else {
        promptSteps.push(new ResourceGroupListStep());
    }

    promptSteps.push(new StaticWebAppNameStep(), new SkuListStep());
    const hasRemote: boolean = !!wizardContext.repoHtmlUrl;

    // if the local project doesn't have a GitHub remote, we will create it for them
    if (!hasRemote) {
        promptSteps.push(new GitHubOrgListStep(), new RepoNameStep(), new RepoPrivacyStep(), new RemoteShortnameStep());
        executeSteps.push(new RepoCreateStep());
    }

    // hard-coding locations available during preview
    // https://github.com/microsoft/vscode-azurestaticwebapps/issues/18
    const locations = [
        'Central US',
        'East US 2',
        'East Asia',
        'West Europe',
        'West US 2'
    ];

    const webProvider: string = 'Microsoft.Web';

    LocationListStep.setLocationSubset(wizardContext, Promise.resolve(locations), webProvider);
    LocationListStep.addStep(wizardContext, promptSteps, {
        placeHolder: localize('selectLocation', 'Select a region for Azure Functions API and staging environments'),
        noPicksMessage: localize('noRegions', 'No available regions.')
    });

    promptSteps.push(new BuildPresetListStep(), new AppLocationStep(), new ApiLocationStep(), new OutputLocationStep());

    executeSteps.push(new VerifyProvidersStep([webProvider]));
    executeSteps.push(new StaticWebAppCreateStep());

    const wizard: AzureWizard<IStaticWebAppWizardContext> = new AzureWizard(wizardContext, {
        title,
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    wizardContext.telemetry.properties.gotRemote = String(hasRemote);
    wizardContext.uri = wizardContext.uri || getSingleRootFsPath();
    wizardContext.telemetry.properties.numberOfWorkspaces = !workspace.workspaceFolders ? String(0) : String(workspace.workspaceFolders.length);

    await wizard.prompt();

    wizardContext.activityTitle = localize('createStaticApp', 'Create Static Web App "{0}"', nonNullProp(wizardContext, 'newStaticWebAppName'));

    if (!context.advancedCreation) {
        wizardContext.newResourceGroupName = await wizardContext.relatedNameTask;
    }

    await wizard.execute();

    await ext.rgApi.appResourceTree.refresh(context);
    const swa: StaticSiteARMResource = nonNullProp(wizardContext, 'staticWebApp');
    await gitPull(nonNullProp(wizardContext, 'repo'));

    const appResource: AppResource = {
        id: nonNullProp(swa, 'id'),
        name: nonNullProp(swa, 'name'),
        type: nonNullProp(swa, 'type'),
        ...swa
    };

    const resolver = new StaticWebAppResolver();
    const resolvedSwa = await resolver.resolveResource(node.subscription, appResource);
    if (resolvedSwa) {
        await showSwaCreated(resolvedSwa);
    }

    return appResource;
}

export async function createStaticWebAppAdvanced(context: IActionContext, node?: SubscriptionTreeItemBase): Promise<AppResource> {
    return await createStaticWebApp({ ...context, advancedCreation: true }, node);
}
