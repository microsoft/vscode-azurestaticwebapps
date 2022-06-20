import { AzExtParentTreeItem, AzExtTreeItem, InvalidTreeItem } from "@microsoft/vscode-azext-utils";
import { isNullOrUndefined } from "util";
import { localize } from "./localize";

export async function createTreeItemsWithErrorHandling<TSource>(
    parent: AzExtParentTreeItem,
    sourceArray: TSource[] | undefined | null,
    invalidContextValue: string,
    createTreeItem: (source: TSource) => AzExtTreeItem | undefined | Promise<AzExtTreeItem | undefined>,
    getLabelOnError: (source: TSource) => string | undefined | Promise<string | undefined>
): Promise<AzExtTreeItem[]> {

    const treeItems: AzExtTreeItem[] = [];
    let lastUnknownItemError: unknown;
    sourceArray ||= [];
    await Promise.all(sourceArray.map(async (source: TSource) => {
        try {
            const item: AzExtTreeItem | undefined = await createTreeItem(source);
            if (item) {
                // Verify at least the following properties can be accessed without an error
                item.contextValue;
                item.description;
                item.label;
                item.iconPath;
                item.id;

                treeItems.push(item);
            }
        } catch (error) {
            let name: string | undefined;
            try {
                name = await getLabelOnError(source);
            } catch {
                // ignore
            }

            if (name) {
                treeItems.push(new InvalidTreeItem(parent, error, {
                    label: name,
                    contextValue: invalidContextValue,
                    data: source
                }));
            } else if (!isNullOrUndefined(error)) {
                lastUnknownItemError = error;
            }
        }
    }));

    if (!isNullOrUndefined(lastUnknownItemError)) {
        // Display a generic error if there are any unknown items. Only the last error will be displayed
        const label: string = localize('cantShowItems', 'Some items could not be displayed');
        treeItems.push(new InvalidTreeItem(parent, lastUnknownItemError, {
            label,
            description: '',
            contextValue: invalidContextValue
        }));
    }

    return treeItems;
}
