/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Temporary declaration for AuthenticationSessionRequest until it's available in @types/vscode
declare module 'vscode' {
    export interface AuthenticationSessionRequest {
        readonly scopes: readonly string[];
    }
}