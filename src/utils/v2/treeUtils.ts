import { ResourceModelBase } from '@microsoft/vscode-azext-utils/hostapi.v2';
import * as vscode from 'vscode';

export interface VisitedResourceModel extends ResourceModelBase {
    getChildren(): vscode.ProviderResult<VisitedResourceModel[]>;
    getTreeItem(): vscode.TreeItem | Thenable<vscode.TreeItem>;
}

export class GenericItem implements VisitedResourceModel {
    constructor(private readonly treeItemFactory: vscode.TreeItem | (() => vscode.TreeItem | Thenable<vscode.TreeItem>)) {
    }

    getChildren(): vscode.ProviderResult<VisitedResourceModel[]> {
        return undefined;
    }

    getTreeItem(): vscode.TreeItem | Thenable<vscode.TreeItem> {
        if (typeof this.treeItemFactory === 'function') {
            return this.treeItemFactory();
        } else {
            return this.treeItemFactory;
        }
    }
}
