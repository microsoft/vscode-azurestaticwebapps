/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { readFile } from "fs-extra";
import { join } from "path";
import { AzExtParentTreeItem, AzExtTreeItem, IParsedError, parseError, TreeItemIconPath } from "vscode-azureextensionui";
import { parse } from "yaml";
import { getYAMLFileName } from "../../utils/gitHubUtils";
import { localize } from "../../utils/localize";
import { treeUtils } from "../../utils/treeUtils";
import { getSingleRootFsPath } from "../../utils/workspaceUtils";
import { EnvironmentTreeItem } from "../EnvironmentTreeItem";
import { GitHubConfigTreeItem } from "./ConfigTreeItem";

export type BuildConfig = 'app_location' | 'api_location' | 'app_artifact_location' | 'output_location';

type ParsedYaml = {
    jobs: {
        build_and_deploy_job: {
            steps: {
                with: {
                    output_location?: string
                }
            }[]
        }
    }
}

export class GitHubConfigGroupTreeItem extends AzExtParentTreeItem {
    public static contextValue: string = 'azureStaticGitHubConfigGroup';
    public contextValue: string = GitHubConfigGroupTreeItem.contextValue;
    public readonly label: string = localize('gitHubConfig', 'GitHub Configuration');
    public parent: EnvironmentTreeItem;

    public constructor(parent: EnvironmentTreeItem) {
        super(parent);
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getThemedIconPath('settings');
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async loadMoreChildrenImpl(): Promise<AzExtTreeItem[]> {
        const buildConfigs: BuildConfig[] = ['app_location', 'api_location'];
        const yamlFileName: string = getYAMLFileName(this.parent);
        const workspacePath: string | undefined = getSingleRootFsPath();

        if (workspacePath) {
            const yamlFilePath: string = join(workspacePath, yamlFileName)
            const yamlFileContents: string = (await readFile(yamlFilePath)).toString();
            const parsedYaml: ParsedYaml = <ParsedYaml>await parse(yamlFileContents);
            let outputLocation: string | undefined;

            try {
                outputLocation = parsedYaml.jobs.build_and_deploy_job.steps[1].with.output_location;
            } catch (error) {
                const parsedError: IParsedError = parseError(error);
                if (/Cannot read property/.test(parsedError.message)) {
                    throw new Error(localize('failedToParseYaml', `Failed to parse YAML. {0}`, parsedError.message));
                }
                throw error;
            }

            if (outputLocation === undefined) {
                buildConfigs.push('app_artifact_location');
            } else {
                buildConfigs.push('output_location');
            }
        } else {
            throw new Error(localize('couldNotFindWorkspace', 'Could not find workspace. Open a single workspace folder to continue.'));
        }

        return await this.createTreeItemsWithErrorHandling(
            buildConfigs,
            'azureStaticConfigInvalid',
            (config: BuildConfig) => new GitHubConfigTreeItem(this, config),
            (config: BuildConfig) => config
        );
    }
}
