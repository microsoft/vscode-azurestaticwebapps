import * as vscode from 'vscode';
import { ResourceModelBase } from "../vscode-azureresourcegroups.api.v2";

export interface StaticWebAppModel extends ResourceModelBase {
    getChildren(): vscode.ProviderResult<StaticWebAppModel[]>;
    getTreeItem(): vscode.TreeItem | Thenable<vscode.TreeItem>;
}
