/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { readFile } from "fs-extra";
import { basename } from "path";
import { ext } from "vscode-azureappservice/out/src/extensionVariables";
import { parse } from "yaml";
import { BuildConfig, BuildConfigs } from "../tree/localProject/ConfigGroupTreeItem";
import { localize } from "./localize";

type BuildDeployStep = {
    id: 'builddeploy',
    with: {
        api_location: string,
        app_location: string,
        output_location?: string,
        app_artifact_location?: string
    }
}

export async function parseYamlFile(yamlFilePath: string): Promise<BuildConfigs | undefined> {
    const contents: string = (await readFile(yamlFilePath)).toString();
    const buildDeployStep: BuildDeployStep | undefined = await getBuildDeployStep(contents, basename(yamlFilePath));

    if (buildDeployStep) {
        return {
            api_location: buildDeployStep.with.api_location,
            app_location: buildDeployStep.with.app_location,
            output_location: buildDeployStep.with.output_location,
            app_artifact_location: buildDeployStep.with.app_artifact_location
        };
    }

    return undefined;
}

/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, no-prototype-builtins */
async function getBuildDeployStep(yamlFileContents: string, yamlFileName: string): Promise<BuildDeployStep | undefined> {
    if (/Azure\/static-web-apps-deploy/.test(yamlFileContents)) {
        const parsedYaml: any = await parse(yamlFileContents);

        for (const job of <any[]>Object.values(parsedYaml.jobs)) {
            for (const step of <any[]>Object.values(job['steps'])) {
                if (step.id === 'builddeploy' && step.with) {
                    if (!stepIncludesBuildConfig(step, 'app_location')) {
                        return showYamlWarningMessage(yamlFileName, 'app_location');
                    } else if (!stepIncludesBuildConfig(step, 'api_location')) {
                        return showYamlWarningMessage(yamlFileName, 'api_location');
                    } else if (!stepIncludesBuildConfig(step, 'output_location') && !stepIncludesBuildConfig(step, 'app_artifact_location')) {
                        return showYamlWarningMessage(yamlFileName, 'output_location');
                    }

                    return <BuildDeployStep>step;
                }
            }
        }
    }

    return undefined;
}

function stepIncludesBuildConfig(step: { with: any }, buildConfig: BuildConfig): boolean {
    return !!step.with.hasOwnProperty(buildConfig);
}
/* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, no-prototype-builtins */

function showYamlWarningMessage(yamlFileName: string, buildConfig: BuildConfig): undefined {
    void ext.ui.showWarningMessage(localize('mustIncludeBuildConfig', `"{0}" must include "{1}". See the [workflow file guide](https://aka.ms/AAbrcox).`, yamlFileName, buildConfig));
    return undefined;
}
