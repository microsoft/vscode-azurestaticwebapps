/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Uri, workspace } from 'vscode';
import { AzureWizardPromptStep, IWizardOptions } from 'vscode-azureextensionui';
import { getGitApi } from '../../getExtensionApi';
import { API } from '../../git';
import { localize } from '../../utils/localize';
import { nonNullProp } from '../../utils/nonNull';
import { selectWorkspaceFolder } from '../../utils/workspaceUtils';
import { GitHubOrgListStep } from '../createStaticWebApp/GitHubOrgListStep';
import { IStaticWebAppWizardContext } from '../createStaticWebApp/IStaticWebAppWizardContext';
import { GitignoreListStep } from './GitignoreListStep';
import { RemoteShortnameStep } from './RemoteShortnameStep';
import { RepoNameStep } from './RepoNameStep';
import { RepoPrivacyStep } from './RepoPrivacyStep';

export class WorkspaceListStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    public async prompt(wizardContext: IStaticWebAppWizardContext): Promise<void> {
        const shouldPrompt: boolean = !workspace.workspaceFolders || workspace.workspaceFolders.length !== 1 || !!wizardContext.advancedCreation;
        if (!shouldPrompt) {
            // only one workspace folder, in basic mode, set that as local code
            wizardContext.fsPath = nonNullProp(workspace, 'workspaceFolders')[0].uri.fsPath;
        } else {
            const selectProject: string = localize('selectProject', 'Select a project to create the new repository');
            wizardContext.fsPath = await selectWorkspaceFolder(selectProject);
        }

        // calling to verify the user has git enabled so they don't go through the whole process and then it fails
        const git: API = await getGitApi();
        const uri: Uri = Uri.file(wizardContext.fsPath);

        // this command doesn't work if the project is not in the workspace, however after running "init" on it, it will generate the Repository object without affecting the repo itself
        // the downside to this is that it is creating a repo if it didn't exist already
        // tslint:disable-next-line: strict-boolean-expressions
        wizardContext.repo = git.getRepository(uri) || await git.init(uri);
    }

    public shouldPrompt(_wizardContext: IStaticWebAppWizardContext): boolean {
        // regardless of prompting or not, this has to run to get the workspace/repo
        return true;
    }

    public async getSubWizard(_wizardContext: IStaticWebAppWizardContext): Promise<IWizardOptions<IStaticWebAppWizardContext> | undefined> {
        // some shouldPrompts depend on having a workspace, so put all of the steps as a subwizard instead
        const promptSteps: AzureWizardPromptStep<IStaticWebAppWizardContext>[] = [];
        promptSteps.push(new GitHubOrgListStep(), new RepoNameStep(), new RepoPrivacyStep(), new RemoteShortnameStep(), new GitignoreListStep());
        return { promptSteps };
    }
}
