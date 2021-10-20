/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { MessageItem, Uri, window, WorkspaceFolder } from "vscode";
import { AzureWizardExecuteStep, DialogResponses, UserCancelledError } from "vscode-azureextensionui";
import { IBuildPreset } from "../../../buildPresets/IBuildPreset";
import { SWACLIOptions, tryGetStaticWebAppsCliConfig } from '../../../cli/tryGetStaticWebAppsCliConfig';
import { swaCliConfigFileName } from '../../../constants';
import { writeFormattedJson } from "../../../utils/fs";
import { localize } from '../../../utils/localize';
import { nonNullProp } from "../../../utils/nonNull";
import { ILocalProjectWizardContext } from "../../setupRunningInVSCode/ILocalProjectWizardContext";

const swaCliDefaultAppLocation = './';

export class CreateStaticWebAppsCliConfigStep extends AzureWizardExecuteStep<ILocalProjectWizardContext> {
    public priority: number = 90;

    public async execute(wizardContext: ILocalProjectWizardContext): Promise<void> {
        const workspaceFolder: WorkspaceFolder = nonNullProp(wizardContext, 'workspaceFolder');
        const buildPreset: IBuildPreset = nonNullProp(wizardContext, 'buildPreset');
        const runCommand: string = nonNullProp(wizardContext, 'runCommand');

        let configName = 'app';

        const appLocationUri = Uri.joinPath(workspaceFolder.uri, wizardContext.appLocation ?? swaCliDefaultAppLocation);
        if (path.basename(appLocationUri.fsPath) !== path.basename(workspaceFolder.uri.fsPath)) {
            configName = path.basename(appLocationUri.fsPath);
        }

        // The Static Web Apps CLI does not resolve paths relative to the cwd, so we must convert "/" into "./"
        if (wizardContext.appLocation === '/') {
            wizardContext.appLocation = swaCliDefaultAppLocation;
        }

        const staticWebAppsCliConfigFileUri = Uri.joinPath(workspaceFolder.uri, swaCliConfigFileName);
        const staticWebAppsCliConfigFile = await tryGetStaticWebAppsCliConfig(workspaceFolder.uri) ?? {};

        if (staticWebAppsCliConfigFile.configurations?.[configName]) {
            const result: MessageItem | undefined = await wizardContext.ui.showWarningMessage(localize('overwriteSwaCliConfig', 'Configuration with name "{0}" already exists. Overwrite?', configName), { modal: true, stepName: 'overwriteFile' }, DialogResponses.yes, DialogResponses.no);
            if (result === DialogResponses.no) {
                throw new UserCancelledError();
            }
        }

        const configurations: Record<string, SWACLIOptions> = {
            ...staticWebAppsCliConfigFile.configurations,
            [configName]: {
                context: `http://localhost:${buildPreset.port}`,
                run: runCommand,
                ...wizardContext.appLocation !== swaCliDefaultAppLocation ? {
                    appLocation: wizardContext.appLocation
                } : {},
                ...wizardContext.apiLocation ? { apiLocation: "http://localhost:7071" } : {}
            }
        }

        await writeFormattedJson(staticWebAppsCliConfigFileUri.fsPath, {
            configurations
        });

        const options = configurations[configName];
        wizardContext.appLocation = options.appLocation ?? '/';

        wizardContext.swaCliConfig = {
            name: configName,
            options: options
        }

        await window.showTextDocument(staticWebAppsCliConfigFileUri);
    }

    public shouldExecute(): boolean {
        return true;
    }
}
