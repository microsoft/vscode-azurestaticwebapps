/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IAzureQuickPickItem } from 'vscode-azureextensionui';
import { buildPresets } from '../../buildPresets/buildPresets';
import { IBuildPreset } from '../../buildPresets/IBuildPreset';
import { ext } from '../../extensionVariables';
import { localize } from '../../utils/localize';
import { openUrl } from '../../utils/openUrl';
import { IStaticWebAppWizardContext } from './IStaticWebAppWizardContext';

export class BuildPresetListStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {

    public async prompt(context: IStaticWebAppWizardContext): Promise<void> {
        const placeHolder: string = localize('choosePreset', 'Choose build preset to configure default project structure');
        const picks: IAzureQuickPickItem<IBuildPreset | undefined>[] = buildPresets.map((pb) => { return { label: pb.displayName, data: pb }; });
        picks.push({ label: localize('custom', '$(keyboard) Custom'), data: undefined });
        const learnMore: IAzureQuickPickItem = { label: localize('learnMore', '$(link-external) Learn more...'), description: '', data: undefined };
        picks.push(learnMore);
        let pick: IAzureQuickPickItem<IBuildPreset | undefined>;

        do {
            pick = await ext.ui.showQuickPick(picks, { placeHolder, suppressPersistence: true });
            if (pick === learnMore) {
                await openUrl('https://aka.ms/SWABuildPresets');
            }
        } while (pick === learnMore);

        if (pick.data) {
            // prefill locations with the preset locations, but don't force the users to use them
            context.presetAppLocation = pick.data.appLocation;
            context.presetApiLocation = pick.data.apiLocation;
            context.presetOutputLocation = pick.data.outputLocation;
        }

        context.telemetry.properties.buildPreset = pick.data?.displayName || 'Custom';

    }

    public shouldPrompt(context: IStaticWebAppWizardContext): boolean {
        return !context.appLocation;
    }
}
