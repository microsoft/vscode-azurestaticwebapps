/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// biome-ignore lint/style/useNodejsImportProtocol: <explanation>
import { promises as fs } from "fs"; // Import the promises API from fs
// biome-ignore lint/style/useNodejsImportProtocol: <explanation>
import type {
  StaticSiteARMResource,
  WebSiteManagementClient,
} from "@azure/arm-appservice";
import {
  LocationListStep,
  ResourceGroupCreateStep,
  ResourceGroupListStep,
  SubscriptionTreeItemBase,
  VerifyProvidersStep,
} from "@microsoft/vscode-azext-azureutils";
import {
  AzExtFsExtra,
  AzureWizard,
  nonNullProp,
  type AzureWizardExecuteStep,
  type AzureWizardPromptStep,
  type ExecuteActivityContext,
  type IActionContext,
  type ICreateChildImplContext,
} from "@microsoft/vscode-azext-utils";
import type { AppResource } from "@microsoft/vscode-azext-utils/hostapi";
import type { Octokit } from "@octokit/rest";
import { homedir } from "os";
import { join } from "path";
import {
  ProgressLocation,
  Uri,
  window,
  workspace,
  type ProgressOptions,
  type WorkspaceFolder,
} from "vscode";
import { Utils } from "vscode-uri";
import { StaticWebAppResolver } from "../../StaticWebAppResolver";
import {
  NodeDetector,
  type DetectorResults,
} from "../../detectors/node/NodeDetector";
import { NodeConstants } from "../../detectors/node/nodeConstants";
import { VerifyingWorkspaceError } from "../../errors";
import { ext } from "../../extensionVariables";
import { createActivityContext } from "../../utils/activityUtils";
import { createWebSiteClient } from "../../utils/azureClients";
import { cpUtils } from "../../utils/cpUtils";
import { getGitHubAccessToken } from "../../utils/gitHubUtils";
import { gitPull } from "../../utils/gitUtils";
import { localize } from "../../utils/localize";
import { telemetryUtils } from "../../utils/telemetryUtils";
import {
  getSingleRootFsPath,
  getSubFolders,
  showNoWorkspacePrompt,
  tryGetWorkspaceFolder,
} from "../../utils/workspaceUtils";
import { RemoteShortnameStep } from "../createRepo/RemoteShortnameStep";
import { RepoCreateStep } from "../createRepo/RepoCreateStep";
import { RepoNameStep } from "../createRepo/RepoNameStep";
import { RepoPrivacyStep } from "../createRepo/RepoPrivacyStep";
import { createOctokitClient } from "../github/createOctokitClient";
import { showSwaCreated } from "../showSwaCreated";
import { ApiLocationStep } from "./ApiLocationStep";
import { AppLocationStep } from "./AppLocationStep";
import { BuildPresetListStep } from "./BuildPresetListStep";
import { GitHubOrgListStep } from "./GitHubOrgListStep";
import type { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";
import { OutputLocationStep } from "./OutputLocationStep";
import { SkuListStep } from "./SkuListStep";
import { StaticWebAppCreateStep } from "./StaticWebAppCreateStep";
import { StaticWebAppNameStep } from "./StaticWebAppNameStep";
import { setGitWorkspaceContexts } from "./setWorkspaceContexts";
import { tryGetApiLocations } from "./tryGetApiLocations";

function isSubscription(
  item?: SubscriptionTreeItemBase
): item is SubscriptionTreeItemBase {
  try {
    // Accessing item.subscription throws an error for some workspace items
    // see https://github.com/microsoft/vscode-azurefunctions/issues/3731
    return !!item && !!item.subscription;
  } catch {
    return false;
  }
}

let isVerifyingWorkspace = false;
export async function createStaticWebApp(
  context: IActionContext &
    Partial<ICreateChildImplContext> &
    Partial<IStaticWebAppWizardContext>,
  node?: SubscriptionTreeItemBase,
  _nodes?: SubscriptionTreeItemBase[],
  ...args: unknown[]
): Promise<AppResource> {
  const isLogicAppParameterPassed = args.length > 0;
  if (isLogicAppParameterPassed) {
    type Resource = { backendResourceId: string; region: string; name: string };
    const logicApp = args[0] as Resource;
    context.shouldInitLogicApp = logicApp;
    return await createStaticWebAppWithLogicApp(context);
  }

  if (isVerifyingWorkspace) {
    throw new VerifyingWorkspaceError(context);
  }
  const progressOptions: ProgressOptions = {
    location: ProgressLocation.Window,
    title: localize("verifyingWorkspace", "Verifying workspace..."),
  };
  isVerifyingWorkspace = true;
  try {
    if (!isSubscription(node)) {
      node =
        await ext.rgApi.appResourceTree.showTreeItemPicker<SubscriptionTreeItemBase>(
          SubscriptionTreeItemBase.contextValue,
          context
        );
    }
    await window.withProgress(progressOptions, async () => {
      const folder = await tryGetWorkspaceFolder(context);
      if (folder) {
        await telemetryUtils.runWithDurationTelemetry(
          context,
          "tryGetFrameworks",
          async () => {
            const detector = new NodeDetector();

            const detectorResult = await detector.detect(folder.uri);
            // comma separated list of all frameworks detected in this project
            context.telemetry.properties.detectedFrameworks =
              `(${detectorResult?.frameworks
                .map((fi) => fi.framework)
                .join("), (")})` ?? "N/A";
            context.telemetry.properties.rootHasSrcFolder = (
              await AzExtFsExtra.pathExists(
                Uri.joinPath(folder.uri, NodeConstants.srcFolderName)
              )
            ).toString();
            const subfolderDetectorResults: DetectorResults[] = [];
            const subWithSrcFolder: string[] = [];
            const subfolders = await getSubFolders(context, folder.uri);
            for (const subfolder of subfolders) {
              const subResult = await detector.detect(subfolder);
              if (subResult) {
                subfolderDetectorResults.push(subResult);
                if (
                  await AzExtFsExtra.pathExists(
                    Uri.joinPath(subfolder, NodeConstants.srcFolderName)
                  )
                ) {
                  subWithSrcFolder.push(Utils.basename(subfolder));
                }
              }
            }
            if (subfolderDetectorResults.length > 0) {
              // example print: "(Angular,Typescript), (Next.js,React), (Nuxt.js), (React), (Svelte), (Vue.js,Vue.js)"
              context.telemetry.properties.detectedFrameworksSub = `(${subfolderDetectorResults
                .map((dr) => dr.frameworks)
                .map((fis) => fis.map((fi) => fi.framework))
                .join("), (")})`;
              context.telemetry.properties.subFoldersWithSrc =
                subWithSrcFolder.join(", ");
            }
          }
        );
        await setGitWorkspaceContexts(context, folder);
        context.detectedApiLocations = await tryGetApiLocations(
          context,
          folder
        );
      } else {
        await showNoWorkspacePrompt(context);
      }
    });
  } finally {
    isVerifyingWorkspace = false;
  }
  const client: WebSiteManagementClient = await createWebSiteClient([
    context,
    node.subscription,
  ]);
  const wizardContext: IStaticWebAppWizardContext = {
    accessToken: await getGitHubAccessToken(),
    client,
    ...context,
    ...node.subscription,
    ...(await createActivityContext()),
  };
  const title: string = localize("createStaticApp", "Create Static Web App");
  const promptSteps: AzureWizardPromptStep<
    IStaticWebAppWizardContext & ExecuteActivityContext
  >[] = [];
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
    promptSteps.push(
      new GitHubOrgListStep(),
      new RepoNameStep(),
      new RepoPrivacyStep(),
      new RemoteShortnameStep()
    );
    executeSteps.push(new RepoCreateStep());
  }
  // hard-coding locations available during preview
  // https://github.com/microsoft/vscode-azurestaticwebapps/issues/18
  const locations = [
    "Central US",
    "East US 2",
    "East Asia",
    "West Europe",
    "West US 2",
  ];
  const webProvider: string = "Microsoft.Web";
  LocationListStep.setLocationSubset(
    wizardContext,
    Promise.resolve(locations),
    webProvider
  );
  LocationListStep.addStep(wizardContext, promptSteps, {
    placeHolder: localize(
      "selectLocation",
      "Select a region for Azure Functions API and staging environments"
    ),
    noPicksMessage: localize("noRegions", "No available regions."),
  });
  promptSteps.push(
    new BuildPresetListStep(),
    new AppLocationStep(),
    new ApiLocationStep(),
    new OutputLocationStep()
  );
  executeSteps.push(new VerifyProvidersStep([webProvider]));
  executeSteps.push(new StaticWebAppCreateStep());
  const wizard: AzureWizard<IStaticWebAppWizardContext> = new AzureWizard(
    wizardContext,
    {
      title,
      promptSteps,
      executeSteps,
      showLoadingPrompt: true,
    }
  );
  wizardContext.telemetry.properties.gotRemote = String(hasRemote);
  wizardContext.uri = wizardContext.uri || getSingleRootFsPath();
  wizardContext.telemetry.properties.numberOfWorkspaces =
    !workspace.workspaceFolders
      ? String(0)
      : String(workspace.workspaceFolders.length);
  await wizard.prompt();
  wizardContext.activityTitle = localize(
    "createStaticApp",
    'Create Static Web App "{0}"',
    nonNullProp(wizardContext, "newStaticWebAppName")
  );
  if (!context.advancedCreation) {
    wizardContext.newResourceGroupName = await wizardContext.relatedNameTask;
  }
  await wizard.execute();
  await ext.rgApi.appResourceTree.refresh(context);
  const swa: StaticSiteARMResource = nonNullProp(wizardContext, "staticWebApp");
  await gitPull(nonNullProp(wizardContext, "repo"));
  const appResource: AppResource = {
    id: nonNullProp(swa, "id"),
    name: nonNullProp(swa, "name"),
    type: nonNullProp(swa, "type"),
    ...swa,
  };
  const resolver = new StaticWebAppResolver();
  const resolvedSwa = await resolver.resolveResource(
    node.subscription,
    appResource
  );
  if (resolvedSwa) {
    await showSwaCreated(resolvedSwa);
  }
  return appResource;
}

export async function createStaticWebAppWithLogicApp(
  context: IActionContext &
    Partial<ICreateChildImplContext> &
    Partial<IStaticWebAppWizardContext>,
  node?: SubscriptionTreeItemBase
): Promise<AppResource> {
  if (isVerifyingWorkspace) {
    throw new VerifyingWorkspaceError(context);
  }
  const progressOptions: ProgressOptions = {
    location: ProgressLocation.Window,
    title: localize("verifyingWorkspace", "Verifying workspace..."),
  };

  isVerifyingWorkspace = true;
  if (!isSubscription(node)) {
    node =
      await ext.rgApi.appResourceTree.showTreeItemPicker<SubscriptionTreeItemBase>(
        SubscriptionTreeItemBase.contextValue,
        context
      );
  }
  const client: WebSiteManagementClient = await createWebSiteClient([
    context,
    node.subscription,
  ]);
  const wizardContext: IStaticWebAppWizardContext = {
    accessToken: await getGitHubAccessToken(),
    client,
    ...context,
    ...node.subscription,
    ...(await createActivityContext()),
  };
  const title: string = localize("createStaticApp", "Create Static Web App");
  const promptSteps: AzureWizardPromptStep<
    IStaticWebAppWizardContext & ExecuteActivityContext
  >[] = [];
  const executeSteps: AzureWizardExecuteStep<IStaticWebAppWizardContext>[] = [];
  if (!context.advancedCreation) {
    //[1] gets standard and not free
    wizardContext.sku = SkuListStep.getSkus()[1];
    executeSteps.push(new ResourceGroupCreateStep());
  } else {
    promptSteps.push(new ResourceGroupListStep());
  }

  promptSteps.push(new StaticWebAppNameStep(), new SkuListStep());
  const wizard: AzureWizard<IStaticWebAppWizardContext> = new AzureWizard(
    wizardContext,
    {
      title,
      promptSteps,
      executeSteps,
      showLoadingPrompt: true,
    }
  );

  wizardContext.uri = wizardContext.uri || getSingleRootFsPath();
  await wizard.prompt();

  //create github template (TODO 7: Make this a function)
  const folderName: string = getFolderName(wizardContext);
  const homeDir = homedir();
  const clonePath = getClonePath(homeDir, folderName);
  const clonePathUri: Uri = Uri.file(clonePath);
  const octokitClient: Octokit = await createOctokitClient(context);
  const { data: response } = await octokitClient.rest.repos.createUsingTemplate(
    {
      private: true,
      template_owner: "alain-zhiyanov",
      template_repo: "template-swa-la",
      name: folderName,
    }
  );
  await sleep(1000);

  //clone github template
  const repoUrl = response.html_url;
  const command = `git clone ${repoUrl} ${clonePath}`;
  await fs.mkdir(clonePath, { recursive: true });
  await cpUtils.executeCommand(undefined, clonePath, command);

  await tryGetWorkspaceFolder(context);
  try {
    await window.withProgress(progressOptions, async () => {
      const folder: WorkspaceFolder = {
        uri: clonePathUri,
        name: "myUri",
        index: 0,
      };
      if (folder) {
        await telemetryUtils.runWithDurationTelemetry(
          context,
          "tryGetFrameworks",
          async () => {
            const detector = new NodeDetector();
            const detectorResult = await detector.detect(folder.uri);
            // comma separated list of all frameworks detected in this project
            context.telemetry.properties.detectedFrameworks =
              `(${detectorResult?.frameworks
                .map((fi) => fi.framework)
                .join("), (")})` ?? "N/A";
            context.telemetry.properties.rootHasSrcFolder = (
              await AzExtFsExtra.pathExists(
                Uri.joinPath(folder.uri, NodeConstants.srcFolderName)
              )
            ).toString();

            const subfolderDetectorResults: DetectorResults[] = [];
            const subWithSrcFolder: string[] = [];
            const subfolders = await getSubFolders(context, folder.uri);
            for (const subfolder of subfolders) {
              const subResult = await detector.detect(subfolder);
              if (subResult) {
                subfolderDetectorResults.push(subResult);
                if (
                  await AzExtFsExtra.pathExists(
                    Uri.joinPath(subfolder, NodeConstants.srcFolderName)
                  )
                ) {
                  subWithSrcFolder.push(Utils.basename(subfolder));
                }
              }
            }

            if (subfolderDetectorResults.length > 0) {
              // example print: "(Angular,Typescript), (Next.js,React), (Nuxt.js), (React), (Svelte), (Vue.js,Vue.js)"
              context.telemetry.properties.detectedFrameworksSub = `(${subfolderDetectorResults
                .map((dr) => dr.frameworks)
                .map((fis) => fis.map((fi) => fi.framework))
                .join("), (")})`;
              context.telemetry.properties.subFoldersWithSrc =
                subWithSrcFolder.join(", ");
            }
          }
        );

        await setGitWorkspaceContexts(context, folder);
        context.detectedApiLocations = await tryGetApiLocations(
          context,
          folder
        );
      } else {
        await showNoWorkspacePrompt(context);
      }
    });
  } finally {
    isVerifyingWorkspace = false;
  }
  let hasRemote = false;
  if (wizardContext.repoHtmlUrl !== null) {
    hasRemote = true;
  }
  wizardContext.telemetry.properties.gotRemote = String(hasRemote);
  // if the local project doesn't have a GitHub remote, we will create it for them
  // this used to be right below website management client, maybe doesn't even need to be ran?
  if (!hasRemote) {
    promptSteps.push(
      new GitHubOrgListStep(),
      new RepoNameStep(),
      new RepoPrivacyStep(),
      new RemoteShortnameStep()
    );

    executeSteps.push(new RepoCreateStep());
  }

  // hard-coding locations available during preview
  // https://github.com/microsoft/vscode-azurestaticwebapps/issues/18
  const locations = [
    "Central US",
    "East US 2",
    "East Asia",
    "West Europe",
    "West US 2",
  ];

  const webProvider: string = "Microsoft.Web";

  LocationListStep.setLocationSubset(
    wizardContext,
    Promise.resolve(locations),
    webProvider
  );
  LocationListStep.addStep(wizardContext, promptSteps, {
    placeHolder: localize(
      "selectLocation",
      "Select a region for Azure Functions API and staging environments"
    ),
    noPicksMessage: localize("noRegions", "No available regions."),
  });

  promptSteps.push(
    new BuildPresetListStep(),
    new AppLocationStep(),
    new ApiLocationStep(),
    new OutputLocationStep()
  );

  executeSteps.push(new VerifyProvidersStep([webProvider]));
  executeSteps.push(new StaticWebAppCreateStep());

  wizardContext.telemetry.properties.numberOfWorkspaces =
    !workspace.workspaceFolders
      ? String(0)
      : String(workspace.workspaceFolders.length);

  await wizard.prompt();

  wizardContext.activityTitle = localize(
    "createStaticApp",
    'Create Static Web App "{0}"',
    nonNullProp(wizardContext, "newStaticWebAppName")
  );

  if (!context.advancedCreation) {
    wizardContext.newResourceGroupName = await wizardContext.relatedNameTask;
  }

  await wizard.execute();

  await ext.rgApi.appResourceTree.refresh(context);
  const swa: StaticSiteARMResource = nonNullProp(wizardContext, "staticWebApp");
  await gitPull(nonNullProp(context, "repo"));

  const appResource: AppResource = {
    id: nonNullProp(swa, "id"),
    name: nonNullProp(swa, "name"),
    type: nonNullProp(swa, "type"),
    ...swa,
  };

  const resolver = new StaticWebAppResolver();
  const resolvedSwa = await resolver.resolveResource(
    node.subscription,
    appResource
  );
  if (resolvedSwa) {
    await showSwaCreated(resolvedSwa);
  }

  return appResource;
}

function getClonePath(homeDir: string, folderName: string) {
  const baseClonePath = join(homeDir, folderName);
  const clonePath = join(baseClonePath, "static-web-app");
  return clonePath;
}

function getFolderName(wizardContext: IStaticWebAppWizardContext): string {
  return wizardContext.newStaticWebAppName || "default_folder_name";
}

export async function createStaticWebAppAdvanced(
  context: IActionContext,
  node?: SubscriptionTreeItemBase
): Promise<AppResource> {
  return await createStaticWebApp({ ...context, advancedCreation: true }, node);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
