import { GenericResource } from '@azure/arm-resources';
import { AzExtParentTreeItem, AzExtTreeItem, IActionContext, ISubscriptionContext } from '@microsoft/vscode-azext-utils';
import { AzureExtensionApi } from '@microsoft/vscode-azext-utils/api';
import * as vscode from 'vscode';

export interface TreeNodeConfiguration {
    readonly label: string;
    readonly id?: string;
    readonly description?: string;
    readonly icon?: vscode.ThemeIcon;
    readonly contextValue?: string;
}

export interface ResolveResult {
    treeItem: (parent: AzExtParentTreeItem) => AzExtParentTreeItem;
    groupConfig?: GroupingConfig;
    description?: string;
}

// ex: Static Web App
interface ApplicationResource extends AzExtParentTreeItem {
    getChildren?(): vscode.ProviderResult<AzExtTreeItem[]>;
    resolve?(clearCache: boolean, context: IActionContext): Thenable<ResolveResult>;

    resolveTooltip?(): Promise<string | vscode.MarkdownString>;
}

export interface GroupingConfig {
    readonly resourceGroup: TreeNodeConfiguration;
    readonly resourceType: TreeNodeConfiguration;
    readonly [label: string]: TreeNodeConfiguration; // Don't need to support right off the bat but we can put it in the interface
}

export interface GroupableApplicationResource extends ApplicationResource {
    readonly groupConfig: GroupingConfig;
}

export type LocalResource = AzExtTreeItem;

export interface ApplicationResourceProvider {
    provideResources(subContext: ISubscriptionContext): vscode.ProviderResult<GenericResource[] | undefined>;
}

export interface ApplicationResourceResolver {
    resolveResource(subContext: ISubscriptionContext, resource: GenericResource): vscode.ProviderResult<ResolveResult>;

}

export interface LocalResourceProvider {
    provideResources(): vscode.ProviderResult<LocalResource[] | undefined>;
}

// called from a resource extension (SWA, Functions, etc)
export declare function registerApplicationResourceResolver(
    provider: ApplicationResourceResolver,
    resourceType: string,
    resourceKind?: string,
): vscode.Disposable;

// Resource Groups can have a default resolve() method that it supplies, that will activate the appropriate extension and give it a chance to replace the resolve() method
// ALSO, it will eliminate that default resolver from future calls for that resource type

// called from host extension (Resource Groups)
// Will need a manifest of extensions mapping type => extension ID
export declare function registerApplicationResourceProvider(
    provider: ApplicationResourceProvider
): vscode.Disposable;

// resource extensions need to activate onView:localResourceView and call this
export declare function registerLocalResourceProvider(
    resourceType: string,
    provider: LocalResourceProvider
): vscode.Disposable;

export interface ExtensionManifestEntry {
    extensionId: string;
    minimumExtensionVersion?: string;
    resourceTypes: {
        resourceType: string,
        resourceKind?: string,
    }[];
}

export interface HostApi extends AzureExtensionApi {
    registerApplicationResourceResolver(
        provider: ApplicationResourceResolver,
        resourceType: string
    ): vscode.Disposable;
}
