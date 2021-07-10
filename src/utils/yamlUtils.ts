/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { readFile } from "fs-extra";
import { basename } from "path";
import { IActionContext } from "vscode-azureextensionui";
import { parse } from "yaml";
import { BuildConfig, BuildConfigs } from "../tree/GitHubConfigGroupTreeItem";
import { localize } from "./localize";

type BuildDeployStep = {
    id?: 'builddeploy',
    with?: BuildConfigs
}

export async function parseYamlFile(context: IActionContext, yamlFilePath: string): Promise<BuildConfigs | undefined> {
    const contents: string = (await readFile(yamlFilePath)).toString();
    const buildDeployStep: BuildDeployStep | undefined = await getBuildDeployStep(context, contents, basename(yamlFilePath));

    if (buildDeployStep) {
        return {
            app_location: buildDeployStep.with?.app_location,
            api_location: buildDeployStep.with?.api_location,
            output_location: buildDeployStep.with?.output_location,
            app_artifact_location: buildDeployStep.with?.app_artifact_location
        };
    }

    return undefined;
}

async function getBuildDeployStep(context: IActionContext, yamlFileContents: string, yamlFileName: string): Promise<BuildDeployStep | undefined> {
    if (/Azure\/static-web-apps-deploy/.test(yamlFileContents)) {
        const parsedYaml = <{ jobs?: { steps?: BuildDeployStep[] }[] }>await parse(yamlFileContents);

        for (const job of Object.values(parsedYaml.jobs || {})) {
            for (const step of Object.values(job.steps || {})) {
                if (step.id === 'builddeploy' && step.with) {
                    const stepIncludesAppLocation: boolean = stepIncludesBuildConfig(step, 'app_location');
                    const stepIncludesApiLocation: boolean = stepIncludesBuildConfig(step, 'api_location');
                    const stepIncludesOutputLocation: boolean = stepIncludesBuildConfig(step, 'output_location') || stepIncludesBuildConfig(step, 'app_artifact_location');

                    if (stepIncludesAppLocation && stepIncludesApiLocation && stepIncludesOutputLocation) {
                        return <BuildDeployStep>step;
                    } else if (!stepIncludesAppLocation) {
                        showYamlWarningMessage(context, yamlFileName, 'app_location');
                    } else if (!stepIncludesApiLocation) {
                        showYamlWarningMessage(context, yamlFileName, 'api_location');
                    } else {
                        showYamlWarningMessage(context, yamlFileName, 'output_location');
                    }

                    // Ignore any other builddeploy steps
                    return undefined;
                }
            }
        }
    }

    return undefined;
}

function stepIncludesBuildConfig(step: BuildDeployStep, buildConfig: BuildConfig): boolean {
    // eslint-disable-next-line no-prototype-builtins
    return !!step.with?.hasOwnProperty(buildConfig);
}

function showYamlWarningMessage(context: IActionContext, yamlFileName: string, buildConfig: BuildConfig): void {
    void context.ui.showWarningMessage(localize('mustIncludeBuildConfig', `"{0}" must include "{1}". See the [workflow file guide](https://aka.ms/AAbrcox).`, yamlFileName, buildConfig));
}
