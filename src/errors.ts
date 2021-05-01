/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { GitErrorCodes } from "./git";
import { localize } from "./utils/localize";

export class NoWorkspaceError extends Error {
    public message: string = localize('noWorkspaceError', 'You must have a workspace open to perform this operation.');
}

// copied from https://github.com/microsoft/vscode/blob/779434d2d118889e2a5a2113714ad6c8bcb3a6e3/extensions/git/src/commands.ts#L2800-L2863
export class GitError extends Error {
    constructor(err: Error & { gitErrorCode?: GitErrorCodes, stdout?: string, stderr?: string }) {
        super();
        switch (err.gitErrorCode) {
            case GitErrorCodes.DirtyWorkTree:
                this.message = localize('clean repo', "Please clean your repository working tree before checkout.");
                break;
            case GitErrorCodes.PushRejected:
                this.message = localize('cant push', "Can't push refs to remote. Try running 'Pull' first to integrate your changes.");
                break;
            case GitErrorCodes.Conflict:
                this.message = localize('merge conflicts', "There are merge conflicts. Resolve them before committing.");
                break;
            case GitErrorCodes.StashConflict:
                this.message = localize('stash merge conflicts', "There were merge conflicts while applying the stash.");
                break;
            case GitErrorCodes.AuthenticationFailed:
                // eslint-disable-next-line no-case-declarations
                const regex = /Authentication failed for '(.*)'/i;
                // eslint-disable-next-line no-case-declarations
                const match = regex.exec(err.stderr || String(err));

                this.message = match
                    ? localize('auth failed specific', "Failed to authenticate to git remote:\n\n{0}", match[1])
                    : localize('auth failed', "Failed to authenticate to git remote.");
                break;
            case GitErrorCodes.NoUserNameConfigured:
            case GitErrorCodes.NoUserEmailConfigured:
                this.message = localize('missing user info', "Make sure you configure your 'user.name' and 'user.email' in git.");
                break;
            default:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, no-case-declarations
                const hint = (err.stderr || err.message || String(err))
                    .replace(/^error: /mi, '')
                    .replace(/^> husky.*$/mi, '')
                    .split(/[\r\n]/)
                    .filter((line: string) => !!line)[0];

                this.message = hint
                    ? localize('git error details', "Git: {0}", hint)
                    : localize('git error', "Git error");

                break;
        }
    }
}
