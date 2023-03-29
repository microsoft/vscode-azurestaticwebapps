/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, nonNullProp, parseError } from '@microsoft/vscode-azext-utils';
import { basename } from 'path';
import { Uri } from 'vscode';
import { cpUtils } from '../../utils/cpUtils';
import { remoteShortnameExists } from '../../utils/gitUtils';
import { localize } from '../../utils/localize';
import { IStaticWebAppWizardContext } from '../createStaticWebApp/IStaticWebAppWizardContext';

export class RemoteShortnameStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {

    public async prompt(context: IStaticWebAppWizardContext): Promise<void> {
        const prompt: string = context.originExists ? localize('enterRemote', 'Remote "origin" already exists in the local repository. Enter a unique shortname for the new remote') :
            localize('enterRemote', 'Enter a unique shortname for the remote Git repository');
        context.newRemoteShortname = await context.ui.showInputBox({
            prompt,
            value: context.originExists ? undefined : 'origin',
            validateInput: async (value) => {
                if (value.length === 0) {
                    return localize('invalidLength', 'The name must be at least 1 character.');
                } else {
                    // remotes have same naming rules as branches
                    // https://stackoverflow.com/questions/41461152/which-characters-are-illegal-within-a-git-remote-name
                    try {
                        await cpUtils.executeCommand(undefined, context.uri?.fsPath, 'git', 'check-ref-format', '--branch', cpUtils.wrapArgInQuotes(value));
                    } catch (err) {
                        if (/is not a valid branch name/g.test(parseError(err).message)) {
                            return localize('notValid', '"{0}" is not a valid remote shortname.', value);
                        }
                        // ignore other errors, we may not be able to access git so we shouldn't block users here
                        // this also will not work for vscode.dev
                    }

                    const uri: Uri = nonNullProp(context, 'uri');
                    if (await remoteShortnameExists(uri, value)) {
                        return localize('remoteExists', 'Remote shortname "{0}" already exists in "{1}".', value, basename(uri.fsPath));
                    }
                }

                return undefined;
            }
        });
    }

    public shouldPrompt(context: IStaticWebAppWizardContext): boolean {
        return !!context.originExists || !!context.advancedCreation;
    }
}
