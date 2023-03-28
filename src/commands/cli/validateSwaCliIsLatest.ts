/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { callWithTelemetryAndErrorHandling, DialogResponses, IActionContext, openUrl } from '@microsoft/vscode-azext-utils';
import * as semver from 'semver';
import * as vscode from 'vscode';
import { installSwaCliUrl } from '../../constants';
import { cpUtils } from '../../utils/cpUtils';
import { localize } from '../../utils/localize';
import { getWorkspaceSetting, updateGlobalSetting } from '../../utils/settingsUtils';
import { getInstalledSwaCliVersion } from './getInstalledSwaCliVersion';
import { getNewestSwaCliVersion } from './getNewestSwaCliVersion';
import { installOrUpdateSwaCli } from './installOrUpdateSwaCli';
import { verifyHasNpm } from './verifyHasNpm';

export async function validateStaticWebAppsCliIsLatest(): Promise<void> {
    await callWithTelemetryAndErrorHandling('staticWebApps.validateStaticWebAppsCliIsLatest', async (context: IActionContext) => {
        context.errorHandling.suppressDisplay = true;
        context.telemetry.properties.isActivationEvent = 'true';

        const showSwaCliWarningKey: string = 'showStaticWebAppsCliWarning';
        const showSwaCliWarning: boolean = !!getWorkspaceSetting<boolean>(showSwaCliWarningKey);

        if (!await verifyHasNpm(context)) {
            return;
        }
        context.telemetry.properties.hasNpm = 'true';

        if (showSwaCliWarning) {
            const installedVersion: string | null = await getInstalledSwaCliVersion();
            if (!installedVersion) {
                return;
            }
            context.telemetry.properties.localVersion = installedVersion;

            const newestVersion: string | undefined = await getNewestSwaCliVersion(context);
            if (!newestVersion) {
                return;
            }

            if (semver.gt(newestVersion, installedVersion)) {
                context.telemetry.properties.outOfDateSwaCli = 'true';
                const message: string = localize(
                    'outdatedSwaCli',
                    'Update the Azure Static Web Apps CLI ({0}) to the latest ({1}) for the best experience.',
                    installedVersion,
                    newestVersion
                );

                const update: vscode.MessageItem = { title: localize('update', 'Update') };
                let result: vscode.MessageItem;

                do {
                    result = await context.ui.showWarningMessage(message, update, DialogResponses.learnMore, DialogResponses.dontWarnAgain)
                    if (result === DialogResponses.learnMore) {
                        await openUrl(installSwaCliUrl);
                    } else if (result === update) {
                        await installOrUpdateSwaCli(context);
                    } else if (result === DialogResponses.dontWarnAgain) {
                        await updateGlobalSetting(showSwaCliWarningKey, false);
                    }
                }
                while (result === DialogResponses.learnMore);
            }
        }
    });
}

export async function hasNpm(): Promise<boolean> {
    try {
        await cpUtils.executeCommand(undefined, undefined, 'npm', '--version');
        return true;
    } catch (e) {
        return false;
    }
}
