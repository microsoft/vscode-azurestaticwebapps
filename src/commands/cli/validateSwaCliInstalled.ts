/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as semver from 'semver';
import { MessageItem } from 'vscode';
import { callWithTelemetryAndErrorHandling, DialogResponses, IActionContext } from 'vscode-azureextensionui';
import { installSwaCliUrl } from '../../constants';
import { localize } from '../../utils/localize';
import { openUrl } from '../../utils/openUrl';
import { getInstalledSwaCliVersion } from './getInstalledSwaCliVersion';
import { installOrUpdateSwaCli } from './installOrUpdateSwaCli';
import { hasNpm } from './validateSwaCliIsLatest';

export async function validateSwaCliInstalled(context: IActionContext, message: string, minVersion?: string): Promise<boolean> {
    let input: MessageItem | undefined;
    let installed: boolean = false;
    const install: MessageItem = { title: localize('install', 'Install') };

    await callWithTelemetryAndErrorHandling('staticWebApps.validateSwaCliInstalled', async (innerContext: IActionContext) => {
        innerContext.errorHandling.suppressDisplay = true;

        const installedVersion: string | null = await getInstalledSwaCliVersion();
        if (installedVersion) {
            installed = true;
            // Ensure minimum version if provided.
            if (minVersion) {
                installed = semver.gte(installedVersion, minVersion);
            }
        } else {
            const items: MessageItem[] = [];
            const isNpmInstalled = await hasNpm();
            if (isNpmInstalled) {
                items.push(install);
            } else {
                items.push(DialogResponses.learnMore);
            }

            // See issue: https://github.com/Microsoft/vscode-azurefunctions/issues/535
            input = await innerContext.ui.showWarningMessage(message, { modal: true }, ...items);

            innerContext.telemetry.properties.dialogResult = input.title;

            if (input === install) {
                await installOrUpdateSwaCli(context);
                installed = true;
            } else if (input === DialogResponses.learnMore) {
                await openUrl(installSwaCliUrl);
            }
        }
    });

    // validate that SWA CLI was installed only if user confirmed
    if (input === install && !installed) {
        await context.ui.showWarningMessage(localize('failedInstallSwaCli', 'The Azure Static Web Apps CLI installation has failed and will have to be installed manually.'), {
            learnMoreLink: installSwaCliUrl
        });
    }

    return installed;
}
