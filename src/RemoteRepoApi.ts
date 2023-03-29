/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// adopted from https://github.com/microsoft/vscode-pull-request-github/blob/main/src/api/api1.ts
import { AzureExtensionApi, createApiProvider } from '@microsoft/vscode-azext-utils';
import { apiUtils } from '@microsoft/vscode-azureresources-api';
import * as vscode from 'vscode';
import { IGit } from './IGit';
import { revealTreeItem } from './commands/api/revealTreeItem';
import { APIState, PublishEvent } from './git';
import { PostCommitCommandsProvider, RemoteRepository } from './rrapi';

export class RemoteRepoApi implements apiUtils.AzureExtensionApiProvider, IGit, vscode.Disposable {
    private static _handlePool: number = 0;
    private _providers = new Map<number, IGit>();

    public get repositories(): RemoteRepository[] {
        const ret: RemoteRepository[] = [];

        this._providers.forEach(({ repositories }) => {
            if (repositories) {
                ret.push(...repositories);
            }
        });

        return ret;
    }

    public async openRepository(uri: vscode.Uri): Promise<RemoteRepository | null> {
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

    // Remote Repositories extension needs to have this API exported to be used,
    // so we need to merge it with the Static Web App extension API. The easiest way to do this is to just implement getApi on RemoteRepoApi
    public getApi = createApiProvider([<AzureExtensionApi>{
        revealTreeItem,
        apiVersion: '1.0.0'
    }]).getApi;

    private _onDidOpenRepository = new vscode.EventEmitter<RemoteRepository>();
    readonly onDidOpenRepository: vscode.Event<RemoteRepository> = this._onDidOpenRepository.event;
    private _onDidCloseRepository = new vscode.EventEmitter<RemoteRepository>();
    readonly onDidCloseRepository: vscode.Event<RemoteRepository> = this._onDidCloseRepository.event;
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
