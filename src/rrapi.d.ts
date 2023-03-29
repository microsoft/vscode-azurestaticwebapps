/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken, Command, Disposable, Uri } from 'vscode';
import { IGit } from './IGit';
import { Ref, Repository } from './git';

export interface InputBox {
    value: string;
}

// unique to Remote Repositories API
export interface RefQuery {
    readonly contains?: string;
    readonly count?: number;
    readonly pattern?: string;
    readonly sort?: 'alphabetically' | 'committerdate';
}

export interface RemoteRepository extends Repository {
    getRefs?(query: RefQuery, cancellationToken?: CancellationToken): Promise<Ref[]>;
    add?(paths: string[]): Promise<void>;
}

export interface PostCommitCommandsProvider {
    getCommands(repository: Repository): Command[];
}

export interface API {
    /**
     * Register a [git provider](#IGit)
     */
    registerGitProvider(provider: IGit): Disposable;

    /**
     * Returns the [git provider](#IGit) that contains a given uri.
     *
     * @param uri An uri.
     * @return A git provider or `undefined`
     */
    getGitProvider(uri: Uri): IGit | undefined;
}

export interface RepositoryDescriptor {
    [key: string]: unknown;
}

export interface Metadata<T extends RepositoryMetadata = RepositoryMetadata> {
    readonly revision: string | undefined;
    readonly cachedMetadata?: Readonly<T>;
}

export enum AccessLevel {
    Admin = 100,
    Maintain = 40,
    WriteToPullRequest = 31,
    Write = 30,
    Triage = 20,
    Read = 10,
    None = 0,
}

export enum HeadType {
    Branch = 0,
    RemoteBranch = 1,
    Tag = 2,
    Commit = 3,
}

export const enum PullRequestState {
    /** A pull request that is still open. */
    Open = 0,
    /** A pull request that has been closed without being merged. */
    Closed = 1,
    /** A pull request that has been closed by being merged. */
    Merged = 2,
}

export interface IncomingChange {
    uri: Uri;
    type: OperationType;
}

export enum OperationType {
    Changed = 1, // FileChangeType.Changed
    Created = 2, // FileChangeType.Created
    Deleted = 3, // FileChangeType.Deleted
}
/**
 * Metadata which associates a specific root uri to a repository
 * Must be JSON.stringify/JSON.parse -able
 */
export interface RepositoryMetadata<T extends RepositoryDescriptor = RepositoryDescriptor> {
    /** The version number of the metadata schema. Used for metadata discard/refresh or migration */
    version: 6;
    /** The timestamp for when this metadata was last updated */
    timestamp: number;
    /** The remote provider for the repository */
    provider: { id: string; name: string };

    /** A user-friendly repository name */
    name: string;
    /** A provider-defined descriptor of the repository */
    repo: T;

    /** The current user's repository access level */
    accessLevel: AccessLevel;
    /** The current HEAD */
    HEAD:
    | {
        /** The type of the current HEAD */
        type: HeadType.Branch;
        /** The friendly name of the current branch */
        name: string;
        /** The current HEAD commit SHA */
        sha: string;
        detached?: undefined;
        /** The current branch including the branch's tip SHA */
        branch: {
            name: string;
            sha: string;
            remote?: undefined;
        };
    }
    | {
        /** The type of the current HEAD */
        type: HeadType.RemoteBranch;
        /** The friendly name of the current remote branch */
        name: string;
        /** The current HEAD commit SHA */
        sha: string;
        detached?: undefined;
        /** The current branch including the branch's tip SHA */
        branch: {
            name: string;
            sha: string;
            remote: {
                name: string;
                accessLevel: AccessLevel;
                repo: T;
            };
        };
    }
    | {
        /** The type of the current detached HEAD */
        type: HeadType.Tag;
        /** The friendly name of the current detached HEAD */
        name: string;
        /** The current HEAD commit SHA */
        sha: string;
        /** Indicates if the current HEAD is detached (e.g. not on a branch) */
        detached: {
            type: HeadType.Tag;
            name: string;
        };
        branch?: undefined;
    }
    | {
        /** The type of the current detached HEAD */
        type: HeadType.Commit;
        /** The friendly name of the current detached HEAD */
        name: string;
        /** The current HEAD commit SHA */
        sha: string;
        /** Indicates if the current HEAD is detached (e.g. not on a branch) */
        detached: {
            type: HeadType.Commit;
            name: string;
        };
        branch?: undefined;
    };
    /** The repository's default branch including the branch's tip SHA */
    defaultBranch: {
        name: string;
        sha: string;
    };
    /** Optional. The pull request, if the repository was opened to a pull request */
    pullRequest?: {
        id: string;
        state: PullRequestState;
        title: string;
    };
    // /** The current SHA */
    // sha: string;
    /** Optional. The current state (think `git status`) of the current branch/SHA to the upstream */
    state?: {
        ahead: number;
        behind: number;
        incomingChanges: IncomingChange[];
    };
    cloneUrl: {
        http: string;
        ssh: string;
    }
}
