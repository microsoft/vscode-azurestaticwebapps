import { GenericResource } from "@azure/arm-resources";
import {
    AzExtParentTreeItem,
    AzExtTreeDataProvider,
    AzExtTreeItem,
    IActionContext,
    ISubscriptionContext,
    TreeItemIconPath
} from "@microsoft/vscode-azext-utils";
import * as vscode from "vscode";

export interface GroupNodeConfiguration {
    readonly label: string;
    readonly id: string;
    // label for GroupBy Configurations
    readonly keyLabel?: string;
    readonly description?: string;
    readonly icon?: vscode.ThemeIcon;
    readonly contextValue?: string;
}

export interface GroupingConfig {
    readonly resourceGroup: GroupNodeConfiguration;
    readonly resourceType: GroupNodeConfiguration;
    [label: string]: GroupNodeConfiguration;
}

export interface ResolvableTreeItem {
    readonly data: GenericResource;
    resolve(clearCache: boolean, context: IActionContext): Promise<ResolveResult>;
}

export interface ResolveResult {
    treeItem: AbstractAzExtTreeItem;
    label?: string;
    description?: string;
    contextValue?: string;
    icon?: vscode.ThemeIcon;

    [key: string]: unknown;
}

// AzExtTreeItem stuff we don't want people to overwrite, but are accessible
// AzExtTreeItemApi, AzExtTreeItemProtected, AzExtTreeItemReserved, *SealedAzExtTreeItem*
// AzExtTreeItem will implement this interface
interface /*Walrused*/ /*Ottered*/ SealedAzExtTreeItem {
    refresh(): Promise<void>;
    /**
     * This id represents the effective/serializable full id of the item in the tree. It always starts with the parent's fullId and ends with either the AzExtTreeItem.id property (if implemented) or AzExtTreeItem.label property
     * This is used for AzureTreeDataProvider.findTreeItem and openInPortal
     */
    readonly fullId: string;
    readonly parent?: AzExtParentTreeItem;
    readonly treeDataProvider: AzExtTreeDataProvider;

    /**
     * The subscription information for this branch of the tree
     * Throws an error if this branch of the tree is not actually for Azure resources
     */
    readonly subscription: ISubscriptionContext;

    /**
     * Values to mask in error messages whenever an action uses this tree item
     * NOTE: Some values are automatically masked without the need to add anything here, like the label and parts of the id if it's an Azure id
     */
    readonly valuesToMask: string[];

    /**
     * Set to true if the label of this tree item does not need to be masked
     */
    suppressMaskLabel?: boolean;
}

// AzExtTreeItem stuff we need them to implement

/**
 * AzExtTreeItem methods that are to be implemented by the base class
 * copied from utils/index.d.ts AzExtTreeItem
 */
export interface AbstractAzExtTreeItem {

    id: string;
    label: string;

    /**
     * Additional information about a tree item that is appended to the label with the format `label (description)`
     */
    description: string | undefined;

    iconPath: TreeItemIconPath | undefined;
    commandId?: string;
    tooltip?: string;

    /**
     * The arguments to pass in when executing `commandId`. If not specified, this tree item will be used.
     */
    commandArgs?: unknown[];
    contextValue: string;

    loadMoreChildrenImpl?(clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]>;

    /**
     * Implement this to support the 'delete' action in the tree. Should not be called directly
     */
    deleteTreeItemImpl?(context: IActionContext): Promise<void>;

    /**
     * Implement this to execute any async code when this node is refreshed. Should not be called directly
     */
    refreshImpl?(context: IActionContext): Promise<void>;

    /**
     * Optional function to filter items displayed in the tree picker. Should not be called directly
     * If not implemented, it's assumed that 'isAncestorOf' evaluates to true
     */
    isAncestorOfImpl?(contextValue: string | RegExp): boolean;
}

export type ResolvedAppResourceTreeItemBase = Partial<{ [P in keyof SealedAzExtTreeItem]: never }> & AbstractAzExtTreeItem;

export type ResolvedItem = ResolvedAppResourceTreeItemBase


export type ResolvedAppResourceTreeItem<T extends ResolvedAppResourceTreeItemBase> = AppResource & Omit<T, keyof ResolvedAppResourceTreeItemBase>;

// ex: Static Web App
// export interface GroupableResource {
//     readonly groupConfig: GroupingConfig;
// }

// export type GroupableAppResource = AppResource & GroupableResource;

export type LocalResource = AzExtTreeItem;

// Unresolved data that we turn into a tree item
// Subsequently this gets turned into an `AppResourceTreeItem` by RG extension
export interface AppResource {
    readonly id: string;
    readonly name: string;
    readonly type: string;
    readonly kind?: string;
    /* add more properties from GenericResource if needed */
}

// Not part of public interface to start with--only Resource Groups extension will call it (for now)
// currently implemented as AzureResourceProvider
export interface AppResourceProvider {
    provideResources(
        subContext: ISubscriptionContext
    ): vscode.ProviderResult<AppResource[]>;
}

export interface AppResourceResolver {
    // return null to explicitly skip this resource
    resolveResource(
        subContext: ISubscriptionContext,
        resource: AppResource
    ): Promise<ResolvedAppResourceTreeItemBase | null> | ResolvedAppResourceTreeItemBase;
}

export interface LocalResourceProvider {
    provideResources(): vscode.ProviderResult<LocalResource[] | undefined>;
}

// called from a resource extension (SWA, Functions, etc)
export declare function registerApplicationResourceResolver(
    provider: AppResourceProvider,
    resourceType: string,
    resourceKind?: string
): vscode.Disposable;

// Resource Groups can have a default resolve() method that it supplies, that will activate the appropriate extension and give it a chance to replace the resolve() method
// ALSO, it will eliminate that default resolver from future calls for that resource type

// called from host extension (Resource Groups)
// Not part of public interface to start with--only Resource Groups extension will call it (for now)
// currently implemented as AzureResourceProvider
export declare function registerApplicationResourceProvider(
    resolver: AppResourceResolver
): vscode.Disposable;

// resource extensions need to activate onView:localResourceView and call this
export declare function registerLocalResourceProvider(
    resourceType: string,
    provider: LocalResourceProvider
): vscode.Disposable;

// export interface ExtensionManifestEntry {
//     extensionId: string;
//     minimumExtensionVersion?: string;
//     resourceTypes: {
//         resourceType: string;
//         resourceKind?: string;
//     }[];
// }

// How a command will look
// async function onCommand(
//     ctx: IActionContext,
//     webApp?: ResolvedAppResourceTreeItem<StaticWebApp>
// ): Promise<void> {
// ...
// }

// example of a current command:
// export async function cloneRepo(context: IActionContext, resource?: StaticWebAppTreeItem | string): Promise<void> {
//     if (resource === undefined) {
//         resource = await ext.tree.showTreeItemPicker<StaticWebAppTreeItem>(StaticWebAppTreeItem.contextValue, context);
//     }

//     let repoUrl: string;
//     if (resource instanceof StaticWebAppTreeItem) {
//         repoUrl = resource.repositoryUrl;
//     } else {
//         repoUrl = resource;
//     }

//     await commands.executeCommand('git.clone', repoUrl);
// }

export type AzExtApi = {
    registerApplicationResourceResolver(
        provider: AppResourceResolver,
        resourceType: string,
        resourceKind?: string
    ): vscode.Disposable;
    apiVersion: string;
}
