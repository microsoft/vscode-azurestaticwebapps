import * as vscode from 'vscode';
import { ApplicationResource, BranchDataProvider } from '../vscode-azureresourcegroups.api.v2';
import { StaticWebAppItem } from './StaticWebAppItem';
import { StaticWebAppModel } from './StaticWebAppModel';

export class StaticWebAppBranchDataProvider extends vscode.Disposable implements BranchDataProvider<ApplicationResource, StaticWebAppModel> {
    private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<StaticWebAppModel>();

    constructor() {
        super(
            () => {
                this.onDidChangeTreeDataEmitter.dispose();
            });
    }

    get onDidChangeTreeData(): vscode.Event<StaticWebAppModel> {
        return this.onDidChangeTreeDataEmitter.event;
    }

    getChildren(element: StaticWebAppModel): vscode.ProviderResult<StaticWebAppModel[]> {
        return element.getChildren();
    }

    getResourceItem(element: ApplicationResource): StaticWebAppModel | Thenable<StaticWebAppModel> {
        return new StaticWebAppItem(element);
    }

    async getTreeItem(element: StaticWebAppModel): Promise<vscode.TreeItem> {
        const ti = {
            ...(await element.getTreeItem()),
            contextValue: element.contextValues.sort().join(';')
        }
        return ti;
    }

    refresh(element: StaticWebAppModel): void {
        this.onDidChangeTreeDataEmitter.fire(element);
    }
}

export const branchDataProvider = new StaticWebAppBranchDataProvider();

