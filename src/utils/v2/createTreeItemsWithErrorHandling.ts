import { isNullOrUndefined } from "util";
import { InvalidItem } from "../../tree/InvalidItem";
import { localize } from "../localize";

export async function createTreeItemsWithErrorHandling<TSource, TModel>(
    sourceArray: TSource[] | undefined | null,
    invalidContextValue: string,
    createTreeItem: (source: TSource) => TModel | undefined | Promise<TModel | undefined>,
    getLabelOnError: (source: TSource) => string | undefined | Promise<string | undefined>
): Promise<TModel[]> {

    const treeItems: TModel[] = [];
    let lastUnknownItemError: unknown;
    sourceArray ||= [];
    await Promise.all(sourceArray.map(async (source: TSource) => {
        try {
            const item: TModel | undefined = await createTreeItem(source);
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
                treeItems.push(new InvalidItem(error, {
                    label: name,
                    contextValue: 'invalid',
                }));
            } else if (!isNullOrUndefined(error)) {
                lastUnknownItemError = error;
            }
        }
    }));

    if (!isNullOrUndefined(lastUnknownItemError)) {
        // Display a generic error if there are any unknown items. Only the last error will be displayed
        const label: string = localize('cantShowItems', 'Some items could not be displayed');
        treeItems.push(new InvalidItem(lastUnknownItemError, {
            label,
            description: '',
            contextValue: invalidContextValue
        }));
    }

    return treeItems;
}
