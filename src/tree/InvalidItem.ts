import { IInvalidTreeItemOptions } from "@microsoft/vscode-azext-utils";
import { ProviderResult, TreeItem } from "vscode";
import { localize } from "../utils/localize";
import { StaticWebAppModel } from "./StaticWebAppModel";

export class InvalidItem implements StaticWebAppModel {
    public readonly data?: unknown;

    constructor(public readonly _error: unknown, private readonly options: IInvalidTreeItemOptions) { }

    getTreeItem(): TreeItem | Thenable<TreeItem> {
        return {
            label: this.options.label,
            description: this.options.description ?? localize('invalid', 'Invalid')
        }
    }

    getChildren(): ProviderResult<StaticWebAppModel[]> {
        return [];
    }

    contextValues: string[] = ['invalidItem'];
}
