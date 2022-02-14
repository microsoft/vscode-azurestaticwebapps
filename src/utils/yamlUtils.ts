/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra, IActionContext } from "@microsoft/vscode-azext-utils";
import { basename } from "path";
import { parse } from "yaml";
import { BuildConfig, BuildConfigs } from "../tree/WorkflowGroupTreeItem";
import { localize } from "./localize";

type BuildDeployStep = {
    id?: 'builddeploy',
    with?: BuildConfigs
}

export async function parseYamlFile(context: IActionContext, yamlFilePath: string): Promise<BuildConfigs | undefined> {
    const contents: string = (await AzExtFsExtra.readFile(yamlFilePath));
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
        // prettyErrors option gives range of error. See https://eemeli.org/yaml/v1/#options
        const parsedYaml = <{ jobs?: { steps?: BuildDeployStep[] }[] }>await parse(yamlFileContents, { prettyErrors: true });

        for (const job of Object.values(parsedYaml.jobs || {})) {
            for (const step of Object.values(job.steps || {})) {
                if (step.id === 'builddeploy' && step.with) {
                    const stepIncludesAppLocation: boolean = stepIncludesBuildConfig(step, 'app_location');

                    if (stepIncludesAppLocation) {
                        return <BuildDeployStep>step;
                    } else if (!stepIncludesAppLocation) {
                        showYamlWarningMessage(context, yamlFileName, 'app_location');
                    }

                    // Ignore any other builddeploy steps
                    return undefined;
                }
            }
        }
    }

    return undefined;
}

export function validateLocationYaml(value: string, buildConfig: BuildConfig): string | undefined {
    const yamlString = `${buildConfig}: "${value}"`;
    try {
        parse(yamlString);
        return;
    } catch (e) {
        return `Invalid YAML syntax: ${yamlString}`;
    }
}

function stepIncludesBuildConfig(step: BuildDeployStep, buildConfig: BuildConfig): boolean {
    // eslint-disable-next-line no-prototype-builtins
    return !!step.with?.hasOwnProperty(buildConfig);
}

function showYamlWarningMessage(context: IActionContext, yamlFileName: string, buildConfig: BuildConfig): void {
    void context.ui.showWarningMessage(localize('mustIncludeBuildConfig', `"{0}" must include "{1}". See the [workflow file guide](https://aka.ms/AAbrcox).`, yamlFileName, buildConfig));
}
