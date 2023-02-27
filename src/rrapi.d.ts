/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken, Command, Disposable, Event, Uri } from 'vscode';
import { RefType, Repository } from './git';

export interface InputBox {
    value: string;
}

export { GitErrorCodes, RefType } from './RemoteRepoApi';

export interface Ref {
    readonly type: RefType;
    readonly name?: string;
    readonly commit?: string;
    readonly remote?: string;
}

export interface UpstreamRef {
    readonly remote: string;
    readonly name: string;
}

export interface Branch extends Ref {
    readonly upstream?: UpstreamRef;
    readonly ahead?: number;
    readonly behind?: number;
}

export interface Commit {
    readonly hash: string;
    readonly message: string;
    readonly parents: string[];
    readonly authorDate?: Date;
    readonly authorName?: string;
    readonly authorEmail?: string;
    readonly commitDate?: Date;
}

export interface Submodule {
    readonly name: string;
    readonly path: string;
    readonly url: string;
}

export interface Remote {
    readonly name: string;
    readonly fetchUrl?: string;
    readonly pushUrl?: string;
    readonly isReadOnly: boolean;
}

export const enum Status {
    INDEX_MODIFIED,
    INDEX_ADDED,
    INDEX_DELETED,
    INDEX_RENAMED,
    INDEX_COPIED,

    MODIFIED,
    DELETED,
    UNTRACKED,
    IGNORED,
    INTENT_TO_ADD,

    ADDED_BY_US,
    ADDED_BY_THEM,
    DELETED_BY_US,
    DELETED_BY_THEM,
    BOTH_ADDED,
    BOTH_DELETED,
    BOTH_MODIFIED,
}

export interface Change {
    /**
     * Returns either `originalUri` or `renameUri`, depending
     * on whether this change is a rename change. When
     * in doubt always use `uri` over the other two alternatives.
     */
    readonly uri: Uri;
    readonly originalUri: Uri;
    readonly renameUri: Uri | undefined;
    readonly status: Status;
}

export interface RepositoryState {
    readonly HEAD: Branch | undefined;
    readonly remotes: Remote[];
    readonly submodules: Submodule[];
    readonly rebaseCommit: Commit | undefined;

    readonly mergeChanges: Change[];
    readonly indexChanges: Change[];
    readonly workingTreeChanges: Change[];

    readonly onDidChange: Event<void>;
}

export interface RepositoryUIState {
    readonly selected: boolean;
    readonly onDidChange: Event<void>;
}

export interface CommitOptions {
    all?: boolean | 'tracked';
    amend?: boolean;
    signoff?: boolean;
    signCommit?: boolean;
    empty?: boolean;
}

export interface FetchOptions {
    remote?: string;
    ref?: string;
    all?: boolean;
    prune?: boolean;
    depth?: number;
}

export interface RefQuery {
    readonly contains?: string;
    readonly count?: number;
    readonly pattern?: string;
    readonly sort?: 'alphabetically' | 'committerdate';
}

export interface BranchQuery extends RefQuery {
    readonly remote?: boolean;
}

export interface Repository {
    readonly inputBox: InputBox;
    readonly rootUri: Uri;
    readonly state: RepositoryState;
    readonly ui: RepositoryUIState;

    /**
     * GH PR saves pull request related information to git config when users checkout a pull request.
     * There are two mandatory config for a branch
     * 1. `remote`, which refers to the related github repository
     * 2. `github-pr-owner-number`, which refers to the related pull request
     *
     * There is one optional config for a remote
     * 1. `github-pr-remote`, which indicates if the remote is created particularly for GH PR review. By default, GH PR won't load pull requests from remotes created by itself (`github-pr-remote=true`).
     *
     * Sample config:
     * ```git
     * [remote "pr"]
     * url = https://github.com/pr/vscode-pull-request-github
     * fetch = +refs/heads/*:refs/remotes/pr/*
     * github-pr-remote = true
     * [branch "fix-123"]
     * remote = pr
     * merge = refs/heads/fix-123
     * github-pr-owner-number = "Microsoft#vscode-pull-request-github#123"
     * ```
     */
    getConfigs(): Promise<{ key: string; value: string }[]>;

    /**
     * Git providers are recommended to implement a minimal key value lookup for git config but you can only provide config for following keys to activate GH PR successfully
     * 1. `branch.${branchName}.github-pr-owner-number`
     * 2. `remote.${remoteName}.github-pr-remote`
     * 3. `branch.${branchName}.remote`
     */
    getConfig(key: string): Promise<string>;

    /**
     * The counterpart of `getConfig`
     */
    setConfig(key: string, value: string): Promise<string>;
    getGlobalConfig(key: string): Promise<string>;

    getObjectDetails(treeish: string, path: string): Promise<{ mode: string; object: string; size: number }>;
    detectObjectType(object: string): Promise<{ mimetype: string; encoding?: string }>;
    buffer(ref: string, path: string): Promise<Buffer>;
    show(ref: string, path: string): Promise<string>;
    getCommit(ref: string): Promise<Commit>;

    clean(paths: string[]): Promise<void>;

    apply(patch: string, reverse?: boolean): Promise<void>;
    diff(cached?: boolean): Promise<string>;
    diffWithHEAD(): Promise<Change[]>;
    diffWithHEAD(path: string): Promise<string>;
    diffWith(ref: string): Promise<Change[]>;
    diffWith(ref: string, path: string): Promise<string>;
    diffIndexWithHEAD(): Promise<Change[]>;
    diffIndexWithHEAD(path: string): Promise<string>;
    diffIndexWith(ref: string): Promise<Change[]>;
    diffIndexWith(ref: string, path: string): Promise<string>;
    diffBlobs(object1: string, object2: string): Promise<string>;
    diffBetween(ref1: string, ref2: string): Promise<Change[]>;
    diffBetween(ref1: string, ref2: string, path: string): Promise<string>;

    hashObject(data: string): Promise<string>;

    createBranch(name: string, checkout: boolean, ref?: string): Promise<void>;
    deleteBranch(name: string, force?: boolean): Promise<void>;
    getBranch(name: string): Promise<Branch>;
    getBranches(query: BranchQuery): Promise<Ref[]>;
    setBranchUpstream(name: string, upstream: string): Promise<void>;
    getRefs(query: RefQuery, cancellationToken?: CancellationToken): Promise<Ref[]>;

    getMergeBase(ref1: string, ref2: string): Promise<string>;

    status(): Promise<void>;
    checkout(treeish: string): Promise<void>;

    addRemote(name: string, url: string): Promise<void>;
    removeRemote(name: string): Promise<void>;
    renameRemote(name: string, newName: string): Promise<void>;

    fetch(options?: FetchOptions): Promise<void>;
    fetch(remote?: string, ref?: string, depth?: number): Promise<void>;
    pull(unshallow?: boolean): Promise<void>;
    push(remoteName?: string, branchName?: string, setUpstream?: boolean): Promise<void>;

    blame(path: string): Promise<string>;
    log(options?: LogOptions): Promise<Commit[]>;

    commit(message: string, opts?: CommitOptions): Promise<void>;
    add(paths: string[]): Promise<void>;
}

/**
 * Log options.
 */
export interface LogOptions {
    /** Max number of log entries to retrieve. If not specified, the default is 32. */
    readonly maxEntries?: number;
    readonly path?: string;
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
