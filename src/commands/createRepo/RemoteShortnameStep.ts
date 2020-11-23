/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { basename } from 'path';
import { AzureWizardPromptStep } from 'vscode-azureextensionui';
import { ext } from '../../extensionVariables';
import { Repository } from '../../git';
import { cpUtils } from '../../utils/cpUtils';
import { localize } from '../../utils/localize';
import { nonNullProp } from '../../utils/nonNull';
import { IStaticWebAppWizardContext } from '../createStaticWebApp/IStaticWebAppWizardContext';

export class RemoteShortnameStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {

    public async prompt(wizardContext: IStaticWebAppWizardContext): Promise<void> {
        wizardContext.newRemoteShortname = await ext.ui.showInputBox({
            placeHolder: localize('enterRemote', 'Enter a unique shortname for the remote Git repository'), validateInput: async (value) => {
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

                    if (wizardContext.repo?.state.remotes.find((remote) => { return remote.name === value; })) {
                        return localize('remoteExists', 'Remote shortname "{0}" already exists in "{1}".', value, basename(nonNullProp(wizardContext, 'fsPath')));
                    }
                }

                return undefined;
            }
        });
    }

    public shouldPrompt(wizardContext: IStaticWebAppWizardContext): boolean {
        // if the repo is undefined, that means there's no chance origin already exists
        const repo: Repository | null | undefined = wizardContext.repo;
        let originExists: boolean = false;
        const remoteName: string = 'origin';
        if (repo) {
            originExists = !!repo.state.remotes.find((remote) => { return remote.name === remoteName; });
        }

        if (!originExists && !wizardContext.advancedCreation) {
            wizardContext.newRemoteShortname = remoteName;
        }

        return originExists || !!wizardContext.advancedCreation;
    }
}
