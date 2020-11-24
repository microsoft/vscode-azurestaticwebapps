/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { basename } from 'path';
import { AzureWizardPromptStep } from 'vscode-azureextensionui';
import { ext } from '../../extensionVariables';
import { cpUtils } from '../../utils/cpUtils';
import { remoteShortnameExists } from '../../utils/gitHubUtils';
import { localize } from '../../utils/localize';
import { nonNullProp } from '../../utils/nonNull';
import { IStaticWebAppWizardContext } from '../createStaticWebApp/IStaticWebAppWizardContext';

export class RemoteShortnameStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {

    public async prompt(wizardContext: IStaticWebAppWizardContext): Promise<void> {
        const prompt: string = wizardContext.originExists ? localize('enterRemote', 'Remote "origin" already exists in the local repository. Enter a unique shortname for the new remote') :
            localize('enterRemote', 'Enter a unique shortname for the remote Git repository');
        wizardContext.newRemoteShortname = await ext.ui.showInputBox({
            prompt,
            value: wizardContext.originExists ? undefined : 'origin',
            validateInput: async (value) => {
                if (value.length === 0) {
                    return localize('invalidLength', 'The name must be at least 1 character.');
                } else {
                    // remotes have same naming rules as branches
                    // https://stackoverflow.com/questions/41461152/which-characters-are-illegal-within-a-git-remote-name
                    try {
                        await cpUtils.executeCommand(undefined, undefined, 'git', 'check-ref-format', '--branch', cpUtils.wrapArgInQuotes(value));
                    } catch (err) {
                        return localize('notValid', '"{0}" is not a valid remote shortname.', value);
                    }

                    const fsPath: string = nonNullProp(wizardContext, 'fsPath');
                    if (await remoteShortnameExists(fsPath, value)) {
                        return localize('remoteExists', 'Remote shortname "{0}" already exists in "{1}".', value, basename(fsPath));
                    }
                }

                return undefined;
            }
        });
    }

    public shouldPrompt(wizardContext: IStaticWebAppWizardContext): boolean {
        return !!wizardContext.originExists || !!wizardContext.advancedCreation;
    }
}
