/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

// adapted from Oryx's C# implementation
// https://github.com/microsoft/Oryx/blob/main/src/Detector/Node/NodeDetector.cs

import { AzExtFsExtra, parseError } from "@microsoft/vscode-azext-utils";
import { Uri } from 'vscode';
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
    public async detect(uri: Uri): Promise<DetectorResults | undefined> {
        let isNodeApp = false;
        let hasLernaJsonFile = false;
        let hasLageConfigJSFile = false;
        let hasYarnrcYmlFile = false;
        let isYarnLockFileValidYamlFormat = false;
        const appDirectory = '';
        let lernaNpmClient = '';

        isNodeApp = (await AzExtFsExtra.pathExists(Uri.joinPath(uri, NodeConstants.PackageJsonFileName)) ||
            await AzExtFsExtra.pathExists(Uri.joinPath(uri, NodeConstants.PackageLockJsonFileName)) ||
            await AzExtFsExtra.pathExists(Uri.joinPath(uri, NodeConstants.YarnLockFileName)));

        hasYarnrcYmlFile = await AzExtFsExtra.pathExists(Uri.joinPath(uri, NodeConstants.YarnrcYmlName));
        const yarnLockUri: Uri = Uri.joinPath(uri, NodeConstants.YarnLockFileName);
        isYarnLockFileValidYamlFormat = await AzExtFsExtra.pathExists(yarnLockUri) && await this.isYarnLockFileYamlFile(yarnLockUri);

        if (await AzExtFsExtra.pathExists(Uri.joinPath(uri, NodeConstants.LernaJsonFileName))) {
            hasLernaJsonFile = true;
            lernaNpmClient = await this.getLearnJsonNpmClient(uri);
        }

        hasLageConfigJSFile = await AzExtFsExtra.pathExists(Uri.joinPath(uri, NodeConstants.LageConfigJSFileName));

        // Copying the logic currently running in Kudu:
        if (!isNodeApp) {
            let mightBeNode = false;
            for (const nodeFile of NodeConstants.TypicalNodeDetectionFiles) {
                if (await AzExtFsExtra.pathExists(Uri.joinPath(uri, nodeFile))) {
                    mightBeNode = true;
                    break;
                }
            }
            // Check if any of the known iis start pages exist
            // If so, then it is not a node.js web site otherwise it is
            if (mightBeNode) {
                for (const iisStartupFile of NodeConstants.IisStartupFiles) {
                    if (await AzExtFsExtra.pathExists(Uri.joinPath(uri, iisStartupFile))) {
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

        const version = await this.getVersionFromPackageJson(uri);
        const detectedFrameworkInfos = await this.detectFrameworkInfos(uri);

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

    private async isYarnLockFileYamlFile(yamlFileUri: Uri): Promise<boolean> {
        try {
            const yamlFile = await AzExtFsExtra.readFile(yamlFileUri);
            parse(yamlFile);
            return true;
        } catch (err) {
            return false;
        }
    }

    private async getVersionFromPackageJson(uri: Uri): Promise<string | undefined> {
        const packageJson = await this.getPackageJsonObject(uri);
        return packageJson?.engines?.node;
    }

    private async getPackageJsonObject(uri: Uri): Promise<PackageJson | undefined> {
        try {
            return <{ engines?: { node?: string } }>JSON.parse((await AzExtFsExtra.readFile(Uri.joinPath(uri, NodeConstants.PackageJsonFileName))));

        } catch (err) {
            console.error(parseError(err).message);
            return undefined;
        }
    }

    private async detectFrameworkInfos(uri: Uri): Promise<FrameworkInfo[]> {
        const detectedFrameworkResult: FrameworkInfo[] = [];
        const packageJson = await this.getPackageJsonObject(uri);

        if (packageJson?.devDependencies !== undefined) {
            const devDependencies = packageJson.devDependencies;
            for (const framework of Object.keys(NodeConstants.DevDependencyFrameworkKeyWordToName)) {
                if (devDependencies[framework]) {
                    detectedFrameworkResult.push({ framework: NodeConstants.DevDependencyFrameworkKeyWordToName[framework as keyof typeof NodeConstants.DevDependencyFrameworkKeyWordToName], version: devDependencies[framework] })
                }
            }
        }

        if (packageJson?.dependencies !== undefined) {
            const dependencies = packageJson.dependencies;
            for (const framework of Object.keys(NodeConstants.DependencyFrameworkKeyWordToName)) {
                if (dependencies[framework]) {
                    detectedFrameworkResult.push({ framework: NodeConstants.DependencyFrameworkKeyWordToName[framework as keyof typeof NodeConstants.DependencyFrameworkKeyWordToName], version: dependencies[framework] })
                }
            }
        }

        if (await AzExtFsExtra.pathExists(Uri.joinPath(uri, NodeConstants.FlutterYamlFileName))) {
            detectedFrameworkResult.push({ framework: NodeConstants.FlutterFrameworkeName, version: '' });
        }

        return detectedFrameworkResult;
    }

    private async getLearnJsonNpmClient(uri: Uri) {
        let npmClientName: string = '';
        if (!await AzExtFsExtra.pathExists(Uri.joinPath(uri, NodeConstants.LernaJsonFileName))) {
            return npmClientName;
        }

        try {
            const learnJson = <{ npmClient?: string }>JSON.parse((await AzExtFsExtra.readFile(Uri.joinPath(uri, NodeConstants.LernaJsonFileName))));
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
