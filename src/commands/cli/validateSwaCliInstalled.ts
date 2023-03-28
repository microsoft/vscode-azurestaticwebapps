/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { callWithTelemetryAndErrorHandling, DialogResponses, IActionContext, openUrl } from '@microsoft/vscode-azext-utils';
import * as semver from 'semver';
import { MessageItem } from 'vscode';
import { installSwaCliUrl } from '../../constants';
import { localize } from '../../utils/localize';
import { getInstalledSwaCliVersion } from './getInstalledSwaCliVersion';
import { installOrUpdateSwaCli } from './installOrUpdateSwaCli';
import { hasNpm } from './validateSwaCliIsLatest';

export async function validateSwaCliInstalled(context: IActionContext, message: string, minVersion?: string): Promise<boolean> {
    let input: MessageItem | undefined;
    let installed: boolean = false;
    let hasMinVersion: boolean = false;
    const install: MessageItem = { title: localize('install', 'Install') };
    const update: MessageItem = { title: localize('update', 'Update') };

    await callWithTelemetryAndErrorHandling('staticWebApps.validateSwaCliInstalled', async (innerContext: IActionContext) => {
        innerContext.errorHandling.suppressDisplay = true;

        const installedVersion: string | null = await getInstalledSwaCliVersion();
        if (installedVersion) {
            installed = true;
            // Ensure minimum version if provided.
            if (minVersion) {
                hasMinVersion = semver.gte(installedVersion, minVersion);
                installed = hasMinVersion;
            }
        }

        if (!installed) {
            const items: MessageItem[] = [];
            const isNpmInstalled = await hasNpm();
            if (isNpmInstalled) {
                items.push(installed ? update : install);
            } else {
                items.push(DialogResponses.learnMore);
            }

            // See issue: https://github.com/Microsoft/vscode-azurefunctions/issues/535
            input = await innerContext.ui.showWarningMessage(message, { modal: true }, ...items);

            innerContext.telemetry.properties.dialogResult = input.title;

            if (input === install || input === update) {
                await installOrUpdateSwaCli(context);
                installed = true;
            } else if (input === DialogResponses.learnMore) {
                await openUrl(installSwaCliUrl);
            }
        }
    });

    // validate that SWA CLI was installed only if user confirmed
    if ((input === install || input === update) && !installed) {
        await context.ui.showWarningMessage(localize('failedInstallSwaCli', 'The Azure Static Web Apps CLI installation has failed and will have to be installed manually.'), {
            learnMoreLink: installSwaCliUrl
        });
    }

    return installed;
}
