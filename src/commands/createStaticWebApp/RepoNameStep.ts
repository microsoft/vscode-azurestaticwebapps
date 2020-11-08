/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit } from '@octokit/rest';
import { basename } from 'path';
import { Disposable, QuickPick, QuickPickItem, window } from 'vscode';
import { AzureWizardPromptStep, IParsedError, parseError } from 'vscode-azureextensionui';
import { getGitApi } from '../../getExtensionApi';
import { localize } from '../../utils/localize';
import { nonNullProp, nonNullValue } from '../../utils/nonNull';
import { selectWorkspaceFolder } from '../../utils/workspaceUtils';
import { createOctokitClient } from '../github/createOctokitClient';
import { IStaticWebAppWizardContext } from './IStaticWebAppWizardContext';

export class RepoNameStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    public async prompt(wizardContext: IStaticWebAppWizardContext): Promise<void> {
        // calling to verify the user has git enabled so they don't go through the whole process and then it fails
        await getGitApi();

        // select a project if no fsPath
        const selectProject: string = localize('selectProject', 'Select a project to create the new repository');
        if (!wizardContext.fsPath) {
            wizardContext.fsPath = await selectWorkspaceFolder(selectProject);
        }

        wizardContext.newRepo = await this.getNewRepoQuickPick(wizardContext, wizardContext.fsPath);
    }

    public shouldPrompt(wizardContext: IStaticWebAppWizardContext): boolean {
        return !wizardContext.newRepo;
    }

    protected async isRepoAvailable(context: IStaticWebAppWizardContext, repo: string): Promise<boolean> {
        const client: Octokit = await createOctokitClient(context.accessToken);
        try {
            await client.repos.get({ owner: nonNullProp(context, 'orgData').login, repo });
        } catch (err) {
            const parsedError: IParsedError = parseError(err);
            // if the repo doesn't exist, it throws a 404 Not Found error
            if (parsedError.message.includes('Not Found')) {
                return true;
            }

            throw err;
        }

        return false;
    }

    private async validateRepoName(context: IStaticWebAppWizardContext, name: string | undefined): Promise<string | undefined> {
        name = name ? name.trim() : '';

        if (name === '.' || name === '..') {
            return localize('reserved', 'The repository "{0}" is reserved.', name);
        } else if (name.length < 1) {
            return localize('invalidLength', 'The name must be between at least 1 character.');
        } else if (!await this.isRepoAvailable(context, name)) {
            return localize('nameUnavailable', 'The repository "{0}" already exists on this account.', name);
        } else {
            return undefined;
        }
    }

    // implementation copied from https://github.com/microsoft/vscode/blob/373ea1b9694c584af60c5581ead9be56cf9f2996/extensions/github/src/publish.ts#L53-L114
    private async getNewRepoQuickPick(context: IStaticWebAppWizardContext, fsPath: string): Promise<{ name: string; isPrivate: boolean }> {
        const quickpick: QuickPick<QuickPickItem & { repo?: string; isPrivate?: boolean }> = window.createQuickPick<QuickPickItem & { repo?: string; isPrivate?: boolean }>();

        quickpick.ignoreFocusOut = true;
        quickpick.placeholder = 'Repository Name';
        quickpick.value = basename(fsPath);
        quickpick.show();

        let repoName: string | undefined;
        let isPrivate: boolean = false;
        const owner: string = nonNullProp(context, 'orgData').login;

        const onDidChangeValue: () => void = async () => {
            const sanitizedRepo: string = quickpick.value.trim().replace(/[^a-z0-9_.]/ig, '-');
            if (!sanitizedRepo) {
                quickpick.items = [];
            } else {
                quickpick.items = [
                    { label: `$(repo) Publish to GitHub private repository`, description: `$(github) ${owner}/${sanitizedRepo}`, alwaysShow: true, repo: sanitizedRepo, isPrivate: true },
                    { label: `$(repo) Publish to GitHub public repository`, description: `$(github) ${owner}/${sanitizedRepo}`, alwaysShow: true, repo: sanitizedRepo, isPrivate: false },
                ];
            }
        };

        // tslint:disable-next-line: no-floating-promises
        onDidChangeValue();

        while (!repoName) {
            const listener: Disposable = quickpick.onDidChangeValue(onDidChangeValue);
            const pick: { repo?: string; isPrivate?: boolean } | undefined = await getPick(quickpick);
            listener.dispose();

            repoName = pick?.repo;
            isPrivate = pick?.isPrivate ?? true;

            if (repoName) {
                try {
                    quickpick.busy = true;
                    const validationMsg: string | undefined = await this.validateRepoName(context, repoName);
                    if (validationMsg) {
                        quickpick.items = [{ label: `$(error) ${validationMsg}`, description: `$(github) ${owner}/${repoName}`, alwaysShow: true }];
                        repoName = undefined;
                    }
                } catch {
                    break;
                } finally {
                    quickpick.busy = false;
                }
            }
        }

        quickpick.dispose();
        return { name: nonNullValue(repoName), isPrivate };

    }
}

async function getPick<T extends QuickPickItem>(qp: QuickPick<T>): Promise<T | undefined> {
    return Promise.race<T | undefined>([
        // tslint:disable-next-line: strict-boolean-expressions
        new Promise<T>(c => qp.onDidAccept(() => qp.selectedItems.length > 0 && c(qp.selectedItems[0]))),
        new Promise<undefined>(c => qp.onDidHide(() => c(undefined)))
    ]);
}
