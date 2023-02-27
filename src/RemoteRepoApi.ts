/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureExtensionApi, createApiProvider } from '@microsoft/vscode-azext-utils';
import * as vscode from 'vscode';
import { AzureExtensionApiProvider } from '../azext-utils-api';
import { revealTreeItem } from './commands/api/revealTreeItem';
import { APIState, IGit, PublishEvent } from './git';
import { API, PostCommitCommandsProvider, Repository } from './rrapi';

export const enum RefType {
    Head,
    RemoteHead,
    Tag,
}

export const enum GitErrorCodes {
    BadConfigFile = 'BadConfigFile',
    AuthenticationFailed = 'AuthenticationFailed',
    NoUserNameConfigured = 'NoUserNameConfigured',
    NoUserEmailConfigured = 'NoUserEmailConfigured',
    NoRemoteRepositorySpecified = 'NoRemoteRepositorySpecified',
    NotAGitRepository = 'NotAGitRepository',
    NotAtRepositoryRoot = 'NotAtRepositoryRoot',
    Conflict = 'Conflict',
    StashConflict = 'StashConflict',
    UnmergedChanges = 'UnmergedChanges',
    PushRejected = 'PushRejected',
    RemoteConnectionError = 'RemoteConnectionError',
    DirtyWorkTree = 'DirtyWorkTree',
    CantOpenResource = 'CantOpenResource',
    GitNotFound = 'GitNotFound',
    CantCreatePipe = 'CantCreatePipe',
    CantAccessRemote = 'CantAccessRemote',
    RepositoryNotFound = 'RepositoryNotFound',
    RepositoryIsLocked = 'RepositoryIsLocked',
    BranchNotFullyMerged = 'BranchNotFullyMerged',
    NoRemoteReference = 'NoRemoteReference',
    InvalidBranchName = 'InvalidBranchName',
    BranchAlreadyExists = 'BranchAlreadyExists',
    NoLocalChanges = 'NoLocalChanges',
    NoStashFound = 'NoStashFound',
    LocalChangesOverwritten = 'LocalChangesOverwritten',
    NoUpstreamBranch = 'NoUpstreamBranch',
    IsInSubmodule = 'IsInSubmodule',
    WrongCase = 'WrongCase',
    CantLockRef = 'CantLockRef',
    CantRebaseMultipleBranches = 'CantRebaseMultipleBranches',
    PatchDoesNotApply = 'PatchDoesNotApply',
}

export class RemoteRepoApi implements AzureExtensionApiProvider, API, IGit, vscode.Disposable {
    private static _handlePool: number = 0;
    private _providers = new Map<number, IGit>();

    public get repositories(): Repository[] {
        const ret: Repository[] = [];

        this._providers.forEach(({ repositories }) => {
            if (repositories) {
                ret.push(...repositories);
            }
        });

        return ret;
    }

    public openRepository(uri: vscode.Uri): Repository | null {
        return this.repositories.find(repo => uri === repo.rootUri) || null;
    }

    public get state(): APIState | undefined {
        if (this._providers.size === 0) {
            return undefined;
        }

        for (const [, { state }] of this._providers) {
            if (state !== 'initialized') {
                return 'uninitialized';
            }
        }

        return 'initialized';
    }

    public getApi = createApiProvider([<AzureExtensionApi>{
        revealTreeItem,
        apiVersion: '1.0.0'
    }]).getApi;

    private _onDidOpenRepository = new vscode.EventEmitter<Repository>();
    readonly onDidOpenRepository: vscode.Event<Repository> = this._onDidOpenRepository.event;
    private _onDidCloseRepository = new vscode.EventEmitter<Repository>();
    readonly onDidCloseRepository: vscode.Event<Repository> = this._onDidCloseRepository.event;
    private _onDidChangeState = new vscode.EventEmitter<APIState>();
    readonly onDidChangeState: vscode.Event<APIState> = this._onDidChangeState.event;
    private _onDidPublish = new vscode.EventEmitter<PublishEvent>();
    readonly onDidPublish: vscode.Event<PublishEvent> = this._onDidPublish.event;

    private _disposables: vscode.Disposable[];
    constructor() {
        this._disposables = [];
    }

    private _updateReposContext() {
        const reposCount = Array.from(this._providers.values()).reduce((prev, current) => {
            return prev + current.repositories.length;
        }, 0);
        void vscode.commands.executeCommand('setContext', 'gitHubOpenRepositoryCount', reposCount);
    }

    registerGitProvider(provider: IGit): vscode.Disposable {
        const handle = this._nextHandle();
        this._providers.set(handle, provider);

        this._disposables.push(provider.onDidCloseRepository(e => this._onDidCloseRepository.fire(e)));
        this._disposables.push(provider.onDidOpenRepository(e => {
            this._updateReposContext();
            this._onDidOpenRepository.fire(e);
        }));
        if (provider.onDidChangeState) {
            console.log(provider.onDidChangeState);
            this._disposables.push(provider.onDidChangeState(e => this._onDidChangeState.fire(e)));
        }
        if (provider.onDidPublish) {
            this._disposables.push(provider.onDidPublish(e => this._onDidPublish.fire(e)));
        }

        this._updateReposContext();
        provider.repositories.forEach(repository => {
            this._onDidOpenRepository.fire(repository);
        });

        return {
            dispose: () => {
                const repos = provider?.repositories;
                if (repos && repos.length > 0) {
                    repos.forEach(r => this._onDidCloseRepository.fire(r));
                }
                this._providers.delete(handle);
            },
        };
    }

    getGitProvider(_uri: vscode.Uri): IGit | undefined {
        const foldersMap = vscode.workspace.workspaceFolders;

        this._providers.forEach(provider => {
            const repos = provider.repositories;
            if (repos && repos.length > 0) {
                for (const repository of repos) {
                    console.log(repository, foldersMap);
                    // foldersMap.set(repository.rootUri, provider);
                }
            }
        });

        return undefined; //foldersMap.findSubstr(uri);
    }

    registerPostCommitCommandsProvider(provider: PostCommitCommandsProvider): vscode.Disposable {
        const disposables = Array.from(this._providers.values()).map(gitProvider => {
            if (gitProvider.registerPostCommitCommandsProvider) {
                return gitProvider.registerPostCommitCommandsProvider(provider);
            }
            return {
                dispose: (): void => {
                    // do nothing
                }
            };
        });
        return {
            dispose: () => {
                for (const disposable of disposables) {
                    disposable.dispose();
                }
            }
        };
    }

    private _nextHandle(): number {
        return RemoteRepoApi._handlePool++;
    }

    dispose(): void {
        for (const disposable of this._disposables) {
            disposable.dispose();
        }
    }
}
