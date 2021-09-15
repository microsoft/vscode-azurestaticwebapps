/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { join } from 'path';
import { AzExtFsExtra, parseError } from "vscode-azureextensionui";
import { parse } from 'yaml';
import { NodeConstants } from "./nodeConstants";

type PackageJson = {
    engines?: {
        node?: string
    },
    devDependencies?: {
        [key: string]: string
    },
    dependencies?: {
        [key: string]: string
    }
}

type FrameworkInfo = {
    framework: string,
    version: string
}

export type DetectorResults = {
    platform: string | undefined,
    platformVersion: string | undefined,
    appDirectory: string | undefined,
    frameworks: FrameworkInfo[],
    hasLernaJsonFile: boolean,
    hasLageConfigJSFile: boolean,
    lernaNpmClient: string | undefined,
    hasYarnrcYmlFile: boolean,
    isYarnLockFileValidYamlFormat: boolean,
}


export class NodeDetector {
    public async detect(fsPath: string): Promise<DetectorResults | undefined> {
        let isNodeApp = false;
        let hasLernaJsonFile = false;
        let hasLageConfigJSFile = false;
        let hasYarnrcYmlFile = false;
        let isYarnLockFileValidYamlFormat = false;
        const appDirectory = '';
        let lernaNpmClient = '';

        isNodeApp = (await AzExtFsExtra.pathExists(join(fsPath, NodeConstants.PackageJsonFileName)) ||
            await AzExtFsExtra.pathExists(join(fsPath, NodeConstants.PackageLockJsonFileName)) ||
            await AzExtFsExtra.pathExists(join(fsPath, NodeConstants.YarnLockFileName)));

        hasYarnrcYmlFile = await AzExtFsExtra.pathExists(join(fsPath, NodeConstants.YarnrcYmlName));
        const yarnLockPath: string = join(fsPath, NodeConstants.YarnLockFileName);
        isYarnLockFileValidYamlFormat = await AzExtFsExtra.pathExists(yarnLockPath) && await this.isYarnLockFileYamlFile(yarnLockPath);

        if (await AzExtFsExtra.pathExists(join(fsPath, NodeConstants.LernaJsonFileName))) {
            hasLernaJsonFile = true;
            lernaNpmClient = await this.getLearnJsonNpmClient(fsPath);
        }

        hasLageConfigJSFile = await AzExtFsExtra.pathExists(join(fsPath, NodeConstants.LageConfigJSFileName));

        // Copying the logic currently running in Kudu:
        if (!isNodeApp) {
            let mightBeNode = false;
            for (const nodeFile of NodeConstants.TypicalNodeDetectionFiles) {
                if (await AzExtFsExtra.pathExists(join(fsPath, nodeFile))) {
                    mightBeNode = true;
                    break;
                }
            }
            // Check if any of the known iis start pages exist
            // If so, then it is not a node.js web site otherwise it is
            if (mightBeNode) {
                for (const iisStartupFile of NodeConstants.IisStartupFiles) {
                    if (await AzExtFsExtra.pathExists(join(fsPath, iisStartupFile))) {
                        // "App in repo is not a Node.js app as it has the file {iisStartupFile}"
                        return undefined;
                    }
                }

                isNodeApp = true;
            } else {
                // "Could not find typical Node.js files in repo"
            }
        }

        if (!isNodeApp) {
            return undefined;
        }

        const version = await this.getVersionFromPackageJson(fsPath);
        const detectedFrameworkInfos = await this.detectFrameworkInfos(fsPath);

        return {
            platform: NodeConstants.PlatformName,
            platformVersion: version,
            appDirectory,
            frameworks: detectedFrameworkInfos,
            hasLernaJsonFile,
            hasLageConfigJSFile,
            lernaNpmClient,
            hasYarnrcYmlFile,
            isYarnLockFileValidYamlFormat,
        };
    }

    private async isYarnLockFileYamlFile(yamlFilePath: string): Promise<boolean> {
        try {
            const yamlFile = await AzExtFsExtra.readFile(yamlFilePath);
            parse(yamlFile);
            return true;
        } catch (err) {
            return false;
        }
    }

    private async getVersionFromPackageJson(fsPath: string): Promise<string | undefined> {
        const packageJson = await this.getPackageJsonObject(fsPath);
        return packageJson?.engines?.node;
    }

    private async getPackageJsonObject(fsPath: string): Promise<PackageJson | undefined> {
        try {
            return <{ engines?: { node?: string } }>JSON.parse((await AzExtFsExtra.readFile(join(fsPath, NodeConstants.PackageJsonFileName))));

        } catch (err) {
            console.error(parseError(err).message);
            return undefined;
        }
    }

    private async detectFrameworkInfos(fsPath: string): Promise<FrameworkInfo[]> {
        const detectedFrameworkResult: FrameworkInfo[] = [];
        const packageJson = await this.getPackageJsonObject(fsPath);

        if (packageJson?.devDependencies !== undefined) {
            const devDependencies = packageJson.devDependencies;
            for (const framework of Object.keys(NodeConstants.DevDependencyFrameworkKeyWordToName)) {
                if (devDependencies[framework]) {
                    detectedFrameworkResult.push({ framework: <string>NodeConstants.DevDependencyFrameworkKeyWordToName[framework], version: devDependencies[framework] })
                }
            }
        }

        if (packageJson?.dependencies !== undefined) {
            const dependencies = packageJson.dependencies;
            for (const framework of Object.keys(NodeConstants.DependencyFrameworkKeyWordToName)) {
                if (dependencies[framework]) {
                    detectedFrameworkResult.push({ framework: <string>NodeConstants.DependencyFrameworkKeyWordToName[framework], version: dependencies[framework] })
                }
            }
        }

        if (await AzExtFsExtra.pathExists(join(fsPath, NodeConstants.FlutterYamlFileName))) {
            detectedFrameworkResult.push({ framework: NodeConstants.FlutterFrameworkeName, version: '' });
        }

        return detectedFrameworkResult;
    }

    private async getLearnJsonNpmClient(fsPath: string) {
        let npmClientName: string = '';
        if (!await AzExtFsExtra.pathExists(join(fsPath, NodeConstants.LernaJsonFileName))) {
            return npmClientName;
        }

        try {
            const learnJson = <{ npmClient?: string }>JSON.parse((await AzExtFsExtra.readFile(join(fsPath, NodeConstants.LernaJsonFileName))));
            if (learnJson?.npmClient) {
                npmClientName = learnJson.npmClient;
            } else {
                //Default Client for Lerna is npm.
                npmClientName = NodeConstants.NpmToolName;
            }
        } catch (err) {
            console.error(`Exception caught while trying to deserialize ${NodeConstants.LernaJsonFileName}`);
        }
        return npmClientName;
    }
}
