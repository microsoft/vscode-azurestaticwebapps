/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IAzureQuickPickItem } from 'vscode-azureextensionui';
import { buildPresets } from '../../buildPresets/buildPresets';
import { IBuildPreset } from '../../buildPresets/IBuildPreset';
import { localize } from '../../utils/localize';
import { IStaticWebAppWizardContext } from './IStaticWebAppWizardContext';

export class BuildPresetListStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    public async prompt(context: IStaticWebAppWizardContext): Promise<void> {
        const placeHolder: string = localize('choosePreset', 'Choose build preset to configure default project structure');
        const picks: IAzureQuickPickItem<IBuildPreset | undefined>[] = buildPresets.map((pb) => { return { label: pb.displayName, data: pb }; });
        picks.push({ label: localize('custom', '$(keyboard) Custom'), data: undefined });
        const pick: IAzureQuickPickItem<IBuildPreset | undefined> = await context.ui.showQuickPick(picks, { placeHolder, suppressPersistence: true, learnMoreLink: 'https://aka.ms/SWABuildPresets' });

        // prefill locations with the preset locations, but don't force the users to use them
        context.buildPreset = pick.data;
        context.telemetry.properties.buildPreset = pick.data?.displayName || 'Custom';
    }

    public shouldPrompt(context: IStaticWebAppWizardContext): boolean {
        return !context.appLocation || !context.buildPreset;
    }
}
