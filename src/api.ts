import { GenericResource } from '@azure/arm-resources';
import { AzExtTreeItem, ISubscriptionContext } from '@microsoft/vscode-azext-utils';
import { AzureExtensionApi } from '@microsoft/vscode-azext-utils/api';
import * as vscode from 'vscode';

interface TreeNodeConfiguration {
    readonly label: string;
    readonly description?: string;
    readonly icon?: vscode.ThemeIcon;
    readonly contextValue?: string;
}

interface ApplicationResource extends TreeNodeConfiguration {
    getChildren?(): vscode.ProviderResult<AzExtTreeItem[]>;
    resolveTooltip?(): Thenable<string | vscode.MarkdownString>;
}

export interface GroupableApplicationResource extends ApplicationResource {
    readonly rootGroupConfig: TreeNodeConfiguration;
    readonly subGroupConfig: {
        readonly resourceGroup: TreeNodeConfiguration;
        readonly resourceType: TreeNodeConfiguration;
        readonly [label: string]: TreeNodeConfiguration; // Don't need to support right off the bat but we can put it in the interface
    }
}

export type LocalResource = AzExtTreeItem;

export declare interface ApplicationResourceProvider {
    matchesResource?(resource: GenericResource): boolean;
    resolveResource(context: ISubscriptionContext, resource: GenericResource, resourceGroup: string): vscode.ProviderResult<GroupableApplicationResource | undefined>;
}

export interface LocalResourceProvider {
    provideResources(): vscode.ProviderResult<LocalResource[] | undefined>;
}

export declare function registerApplicationResourceProvider(
    resourceType: string,
    provider: ApplicationResourceProvider
): vscode.Disposable;

export declare function registerLocalResourceProvider(
    provider: LocalResourceProvider
): vscode.Disposable;

export interface AzExtProviderApi extends AzureExtensionApi {
    registerLocalResourceProvider(
        provider: LocalResourceProvider
    ): vscode.Disposable;

    registerApplicationResourceProvider(
        resourceType: string,
        provider: ApplicationResourceProvider
    ): vscode.Disposable;
}
