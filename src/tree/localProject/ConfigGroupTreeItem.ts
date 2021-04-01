/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { readdir, readFile } from "fs-extra";
import { basename, join } from "path";
import { ThemeIcon } from "vscode";
import { ext } from "vscode-azureappservice/out/src/extensionVariables";
import { AzExtParentTreeItem, AzExtTreeItem, TreeItemIconPath } from "vscode-azureextensionui";
import { parse } from "yaml";
import { localize } from "../../utils/localize";
import { EnvironmentTreeItem } from "../EnvironmentTreeItem";
import { GitHubConfigTreeItem } from "./ConfigTreeItem";

export type BuildConfig = 'app_location' | 'api_location' | 'app_artifact_location' | 'output_location';

export class GitHubConfigGroupTreeItem extends AzExtParentTreeItem {
    public static contextValue: string = 'azureStaticGitHubConfigGroup';
    public contextValue: string = GitHubConfigGroupTreeItem.contextValue;
    public readonly label: string = localize('gitHubConfig', 'GitHub Configuration');
    public parent: EnvironmentTreeItem;
    public yamlFilePath: string;
    public buildConfigs: Map<BuildConfig, string>;

    public constructor(parent: EnvironmentTreeItem, yamlFilePath: string, buildConfigs: Map<BuildConfig, string>) {
        super(parent);
        this.yamlFilePath = yamlFilePath;
        this.buildConfigs = buildConfigs;
        this.id = `${parent.id}-${this.yamlFilePath}`;
    }

    public static async createGitHubConfigGroupTreeItems(parent: EnvironmentTreeItem): Promise<GitHubConfigGroupTreeItem[]> {
        if (parent.localProjectPath && parent.inWorkspace) {
            const treeItems: GitHubConfigGroupTreeItem[] = [];
            const workflowsDir: string = join(parent.localProjectPath, '.github/workflows');
            const yamlFiles: string[] = await readdir(workflowsDir);

            for (const yamlFile of yamlFiles) {
                if (/\.(yml|yaml)$/i.test(yamlFile)) {
                    const yamlFilePath: string = join(workflowsDir, yamlFile);
                    const contents: string = (await readFile(yamlFilePath)).toString();

                    if (/Azure\/static-web-apps-deploy/.test(contents)) {
                        /* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, no-prototype-builtins */
                        const parsedYaml: any = await parse(contents);
                        const buildConfigs: Map<BuildConfig, string> = new Map();

                        for (const job of <any[]>Object.values(parsedYaml.jobs)) {
                            for (const step of <any[]>Object.values(job['steps'])) {
                                if (step.hasOwnProperty('id') && step['id'] === 'builddeploy') {
                                    if (!step.hasOwnProperty('with') || !step['with'].hasOwnProperty('api_location') || !step['with'].hasOwnProperty('app_location')) {
                                        void ext.ui.showWarningMessage(localize('mustContainLocs', `"{0}" must include "api_location" and "app_location". See the [workflow file guide](https://aka.ms/AAbrcox).`, yamlFile));
                                        continue;
                                    }

                                    buildConfigs.set('api_location', step['with']['api_location'])
                                    buildConfigs.set('app_location', step['with']['app_location'])

                                    if (step['with'].hasOwnProperty('output_location')) {
                                        buildConfigs.set('output_location', step['with']['output_location'])
                                    } else if (step['with'].hasOwnProperty('app_artifact_location')) {
                                        buildConfigs.set('app_artifact_location', step['with']['app_artifact_location'])
                                    } else {
                                        void ext.ui.showWarningMessage(localize('mustContainOutputLocs', `"{0}" must include "output_location" or "app_artifact_location". See the [workflow file guide](https://aka.ms/AAbrcox).`, yamlFile));
                                        continue;
                                    }
                                }
                            }
                        }
                        /* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, no-prototype-builtins */

                        treeItems.push(new GitHubConfigGroupTreeItem(parent, yamlFilePath, buildConfigs));
                    }
                }
            }

            return treeItems;
        }

        return [];
    }

    public get iconPath(): TreeItemIconPath {
        return new ThemeIcon('settings-gear');
    }

    public get description(): string {
        return basename(this.yamlFilePath);
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async loadMoreChildrenImpl(): Promise<AzExtTreeItem[]> {
        const treeItems: GitHubConfigTreeItem[] = [];
        this.buildConfigs.forEach((value: string, config: BuildConfig) => {
            treeItems.push(new GitHubConfigTreeItem(this, config, value));
        });
        return treeItems;
    }
}
