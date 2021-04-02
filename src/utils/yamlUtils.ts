/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, no-prototype-builtins */

import { readFile } from "fs-extra";
import { basename } from "path";
import { ext } from "vscode-azureappservice/out/src/extensionVariables";
import { parse } from "yaml";
import { BuildConfig } from "../tree/localProject/ConfigGroupTreeItem";
import { localize } from "./localize";

export async function parseYamlFile(yamlFilePath: string): Promise<Map<BuildConfig, string> | undefined> {
    const contents: string = (await readFile(yamlFilePath)).toString();

    if (isSwaYaml(contents)) {
        const parsedYaml: any = await parse(contents);

        for (const job of <any[]>Object.values(parsedYaml.jobs)) {
            for (const step of <any[]>Object.values(job['steps'])) {
                if (isBuildDeployStep(step)) {
                    return getBuildConfigs(step, basename(yamlFilePath));
                }
            }
        }
    }

    return undefined;
}

function isSwaYaml(yamlFileContents: string): boolean {
    return /Azure\/static-web-apps-deploy/.test(yamlFileContents);
}

function isBuildDeployStep(step: any): boolean {
    return step.hasOwnProperty('id') && step['id'] === 'builddeploy';
}

function getBuildConfigs(step: any, yamlFileName: string): Map<BuildConfig, string> | undefined {
    if (!step.hasOwnProperty('with') || !step['with'].hasOwnProperty('api_location') || !step['with'].hasOwnProperty('app_location')) {
        void ext.ui.showWarningMessage(localize('mustIncludeLocations', `"{0}" must include "api_location" and "app_location". See the [workflow file guide](https://aka.ms/AAbrcox).`, yamlFileName));
        return undefined;
    }

    const buildConfigs: Map<BuildConfig, string> = new Map();
    buildConfigs.set('api_location', getBuildConfig(step, 'api_location'))
    buildConfigs.set('app_location', getBuildConfig(step, 'app_location'))

    if (step['with'].hasOwnProperty('output_location')) {
        buildConfigs.set('output_location', getBuildConfig(step, 'output_location'))
    } else if (step['with'].hasOwnProperty('app_artifact_location')) {
        buildConfigs.set('app_artifact_location', getBuildConfig(step, 'app_artifact_location'))
    } else {
        void ext.ui.showWarningMessage(localize('mustIncludeOutputLocation', `"{0}" must include "output_location" or "app_artifact_location". See the [workflow file guide](https://aka.ms/AAbrcox).`, yamlFileName));
        return undefined;
    }

    return buildConfigs;
}

function getBuildConfig(step: any, buildConfig: BuildConfig): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return step['with'][buildConfig];
}
