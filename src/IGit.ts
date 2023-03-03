/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable, Event, Uri } from "vscode";
import { APIState, PublishEvent, Repository } from "./git";
import { Metadata, PostCommitCommandsProvider } from "./rrapi";

export interface IGit {
    readonly repositories: Repository[];
    readonly onDidOpenRepository: Event<Repository>;
    readonly onDidCloseRepository: Event<Repository>;
    openRepository(root: Uri): Promise<Repository | null>

    // Used by the actual git extension to indicate it has finished initializing state information
    readonly state?: APIState;
    readonly metadata?: Metadata;
    readonly onDidChangeState?: Event<APIState>;
    readonly onDidPublish?: Event<PublishEvent>;

    registerPostCommitCommandsProvider?(provider: PostCommitCommandsProvider): Disposable;

    // only applies for local git
    init?(root: Uri): Promise<Repository | null>;
}
