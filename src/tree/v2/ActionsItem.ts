/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ActionsItemBase, GitHubSourceControl } from "@microsoft/vscode-azext-github";

export class ActionsItem extends ActionsItemBase {
    constructor(
        parentId: string,
        contextValueExtensionPrefix: string,
        readonly repositoryUrl: string,
        readonly repositoryBranch: string,
    ) {
        super(parentId, contextValueExtensionPrefix);
    }

    async getSourceControl(): Promise<GitHubSourceControl | undefined> {
        return { repoUrl: this.repositoryUrl, repoBranch: this.repositoryBranch };
    }
}
