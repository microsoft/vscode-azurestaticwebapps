/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IAzureQuickPickItem, IWizardOptions } from 'vscode-azureextensionui';
import { buildPresets } from '../../buildPresets/buildPresets';
import { IBuildPreset } from '../../buildPresets/IBuildPreset';
import { ext } from '../../extensionVariables';
import { localize } from '../../utils/localize';
import { openUrl } from '../../utils/openUrl';
import { ApiLocationStep } from './ApiLocationStep';
import { AppLocationStep } from './AppLocationStep';
import { IStaticWebAppWizardContext } from './IStaticWebAppWizardContext';
import { OutputLocationStep } from './OutputLocationStep';

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
            context.appLocation = pick.data.appLocation;
            context.apiLocation = pick.data.apiLocation;
            context.outputLocation = pick.data.outputLocation;
        }

    }

    public shouldPrompt(context: IStaticWebAppWizardContext): boolean {
        return !context.appLocation;
    }

    public async getSubWizard(context: IStaticWebAppWizardContext): Promise<IWizardOptions<IStaticWebAppWizardContext> | undefined> {
        if (!context.appLocation) {
            return { promptSteps: [new AppLocationStep(), new ApiLocationStep(), new OutputLocationStep()] };
        } else {
            return undefined;
        }
    }
}
