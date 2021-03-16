/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Uri } from "vscode";
import { IActionContext, IParsedError, parseError } from "vscode-azureextensionui";
import { ext } from "../extensionVariables";
import { getGitApi } from "../getExtensionApi";
import { API, Repository } from "../git";
import { LocalProjectTreeItem } from "../tree/localProject/LocalProjectTreeItem";
import { localize } from "../utils/localize";

export async function gitPull(context: IActionContext, localProjectTreeItem: LocalProjectTreeItem): Promise<void> {
    const git: API = await getGitApi();
    const projectUri: Uri = Uri.file(localProjectTreeItem.projectPath);
    const repo: Repository | null = git.getRepository(projectUri);

    if (repo) {
        try {
            await repo.pull();
        } catch (error) {
            const parsedError: IParsedError = parseError(error);
            if (/Failed to execute git/.test(parsedError.message)) {
                /* eslint-disable @typescript-eslint/no-unsafe-member-access */
                error.stderr && ext.outputChannel.appendLog(error.stderr);
                error.stdout && ext.outputChannel.appendLog(error.stdout);
                /* eslint-enable @typescript-eslint/no-unsafe-member-access */

                throw new Error(localize('failedToExecGitPull', 'Failed to execute "git pull". Check the [output window](command:{0}) for more details.', `${ext.prefix}.showOutputChannel`));
            } else {
                throw error;
            }
        }

        await localProjectTreeItem.refresh(context);
    } else {
        throw new Error(localize('couldNotFindRepo', 'Could not find git repository.'));
    }
}
