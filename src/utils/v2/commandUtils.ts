import { IActionContext, registerCommand } from "@microsoft/vscode-azext-utils";
import { ResourceModelBase, WrappedResourceModel } from "../../vscode-azureresourcegroups.api.v2";

export type BranchCommandCallback = (context: IActionContext, item: unknown, ...args: unknown[]) => unknown;

function isWrappedItem(value: WrappedResourceModel | unknown): value is WrappedResourceModel {
    return (value as WrappedResourceModel)?.unwrap !== undefined;
}

export function registerBranchCommand(commandId: string, callback: BranchCommandCallback, debounce?: number, telemetryId?: string): void {
    registerCommand(
        commandId,
        (context, item: WrappedResourceModel | unknown, ...args: unknown[]) => callback(context, isWrappedItem(item) ? item.unwrap<ResourceModelBase>() : item, ...args),
        debounce,
        telemetryId);
}
