/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ProgressLocation, Uri, window } from "vscode";
import { IParsedError, parseError } from "vscode-azureextensionui";
import { ext } from "../extensionVariables";
import { getGitApi } from "../getExtensionApi";
import { API, Repository } from "../git";
import { localize } from "../utils/localize";

export async function gitPull(projectPath: string): Promise<void> {
    const git: API = await getGitApi();
    const projectUri: Uri = Uri.file(projectPath);
    const repo: Repository | null = git.getRepository(projectUri);

    if (repo) {
        try {
            const title: string = localize('executingGitPull', 'Executing "git pull"...');
            await window.withProgress({ location: ProgressLocation.Notification, title }, async (): Promise<void> => {
                await repo.pull();
            });
        } catch (error) {
            const parsedError: IParsedError = parseError(error);
            if (/Failed to execute git/.test(parsedError.message)) {
                const gitError = <{ stdout: string | undefined, stderr: string | undefined }>error;
                gitError.stdout && ext.outputChannel.appendLog(gitError.stdout);
                gitError.stderr && ext.outputChannel.appendLog(gitError.stderr);
                throw new Error(localize('failedToExecGitPull', 'Failed to execute "git pull". Check the [output window](command:{0}) for more details.', `${ext.prefix}.showOutputChannel`));
            } else {
                throw error;
            }
        }

        const message: string = localize('gitPullSuccess', 'Successfully executed "git pull".');
        void window.showInformationMessage(message);
    } else {
        throw new Error(localize('couldNotFindRepo', 'Could not find git repository. Open a folder containing a git repository to continue.'));
    }
}
