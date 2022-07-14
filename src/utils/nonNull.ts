/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { nonNullProp, nonNullValue } from "@microsoft/vscode-azext-utils";

/**
 * Validates that a given object is not null and not undefined.
 * Then retrieves a property by name from that object and checks that it's not null and not undefined.  It is strongly typed
 * for the property and will give a compile error if the given name is not a property of the source.
 */
export function nonNullValueAndProp<TSource, TKey extends keyof TSource>(source: TSource | undefined, name: TKey): NonNullable<TSource[TKey]> {
    return nonNullProp(nonNullValue(source, <string>name), name);
}
