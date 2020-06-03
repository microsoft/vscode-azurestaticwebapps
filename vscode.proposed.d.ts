/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * This is the place for API experiments and proposals.
 * These API are NOT stable and subject to change. They are only available in the Insiders
 * distribution and CANNOT be used in published extensions.
 *
 * To test these API in local environment:
 * - Use Insiders release of VS Code.
 * - Add `"enableProposedApi": true` to your package.json.
 * - Copy this file to your project.
 */

declare module 'vscode' {

    // #region auth provider: https://github.com/microsoft/vscode/issues/88309

    export interface AuthenticationSession {
        id: string;
        getAccessToken(): Thenable<string>;
        account: {
            displayName: string;
            id: string;
        };
        scopes: string[];
    }

    export class AuthenticationSession2 {
		/**
		 * The identifier of the authentication session.
		 */
        readonly id: string;

		/**
		 * The access token.
		 */
        readonly accessToken: string;

		/**
		 * The account associated with the session.
		 */
        readonly account: {
			/**
			 * The human-readable name of the account.
			 */
            readonly displayName: string;

			/**
			 * The unique identifier of the account.
			 */
            readonly id: string;
        };

		/**
		 * The permissions granted by the session's access token. Available scopes
		 * are defined by the authentication provider.
		 */
        readonly scopes: string[];

        constructor(id: string, accessToken: string, account: { displayName: string, id: string }, scopes: string[]);
    }

	/**
	 * An [event](#Event) which fires when an [AuthenticationProvider](#AuthenticationProvider) is added or removed.
	 */
    export interface AuthenticationProvidersChangeEvent {
		/**
		 * The ids of the [authenticationProvider](#AuthenticationProvider)s that have been added.
		 */
        readonly added: string[];

		/**
		 * The ids of the [authenticationProvider](#AuthenticationProvider)s that have been removed.
		 */
        readonly removed: string[];
    }

	/**
	 * Options to be used when getting a session from an [AuthenticationProvider](#AuthenticationProvider).
	 */
    export interface AuthenticationGetSessionOptions {
		/**
		 *  Whether login should be performed if there is no matching session. Defaults to false.
		 */
        createIfNone?: boolean;

		/**
		 * Whether the existing user session preference should be cleared. Set to allow the user to switch accounts.
		 * Defaults to false.
		 */
        clearSessionPreference?: boolean;
    }

	/**
	* An [event](#Event) which fires when an [AuthenticationSession](#AuthenticationSession) is added, removed, or changed.
	*/
    export interface AuthenticationSessionsChangeEvent {
		/**
		 * The ids of the [AuthenticationSession](#AuthenticationSession)s that have been added.
		*/
        readonly added: string[];

		/**
		 * The ids of the [AuthenticationSession](#AuthenticationSession)s that have been removed.
		 */
        readonly removed: string[];

		/**
		 * The ids of the [AuthenticationSession](#AuthenticationSession)s that have been changed.
		 */
        readonly changed: string[];
    }

	/**
	 * **WARNING** When writing an AuthenticationProvider, `id` should be treated as part of your extension's
	 * API, changing it is a breaking change for all extensions relying on the provider. The id is
	 * treated case-sensitively.
	 */
    export interface AuthenticationProvider {
		/**
		 * Used as an identifier for extensions trying to work with a particular
		 * provider: 'microsoft', 'github', etc. id must be unique, registering
		 * another provider with the same id will fail.
		 */
        readonly id: string;

		/**
		 * The human-readable name of the provider.
		 */
        readonly displayName: string;

		/**
		 * Whether it is possible to be signed into multiple accounts at once with this provider
		*/
        readonly supportsMultipleAccounts: boolean;

		/**
		 * An [event](#Event) which fires when the array of sessions has changed, or data
		 * within a session has changed.
		 */
        readonly onDidChangeSessions: Event<AuthenticationSessionsChangeEvent>;

		/**
		 * Returns an array of current sessions.
		 */
        getSessions(): Thenable<ReadonlyArray<AuthenticationSession2>>;

		/**
		 * Prompts a user to login.
		 */
        login(scopes: string[]): Thenable<AuthenticationSession2>;

		/**
		 * Removes the session corresponding to session id.
		 * @param sessionId The session id to log out of
		 */
        logout(sessionId: string): Thenable<void>;
    }

    export namespace authentication {
		/**
		 * Register an authentication provider.
		 *
		 * There can only be one provider per id and an error is being thrown when an id
		 * has already been used by another provider.
		 *
		 * @param provider The authentication provider provider.
		 * @return A [disposable](#Disposable) that unregisters this provider when being disposed.
		 */
        export function registerAuthenticationProvider(provider: AuthenticationProvider): Disposable;

		/**
		 * Fires with the provider id that was registered or unregistered.
		 */
        export const onDidChangeAuthenticationProviders: Event<AuthenticationProvidersChangeEvent>;

		/**
		 * The ids of the currently registered authentication providers.
		 * @returns An array of the ids of authentication providers that are currently registered.
		 */
        export function getProviderIds(): Thenable<ReadonlyArray<string>>;

		/**
		 * An array of the ids of authentication providers that are currently registered.
		 */
        export const providerIds: string[];

		/**
		 * Returns whether a provider has any sessions matching the requested scopes. This request
		 * is transparent to the user, not UI is shown. Rejects if a provider with providerId is not
		 * registered.
		 * @param providerId The id of the provider
		 * @param scopes A list of scopes representing the permissions requested. These are dependent on the authentication
		 * provider
		 * @returns A thenable that resolve to whether the provider has sessions with the requested scopes.
		 */
        export function hasSessions(providerId: string, scopes: string[]): Thenable<boolean>;

		/**
		 * Get an authentication session matching the desired scopes. Rejects if a provider with providerId is not
		 * registered, or if the user does not consent to sharing authentication information with
		 * the extension. If there are multiple sessions with the same scopes, the user will be shown a
		 * quickpick to select which account they would like to use.
		 * @param providerId The id of the provider to use
		 * @param scopes A list of scopes representing the permissions requested. These are dependent on the authentication provider
		 * @param options The [getSessionOptions](#GetSessionOptions) to use
		 * @returns A thenable that resolves to an authentication session
		 */
        export function getSession(providerId: string, scopes: string[], options: AuthenticationGetSessionOptions & { createIfNone: true }): Thenable<AuthenticationSession2>;

		/**
		 * Get an authentication session matching the desired scopes. Rejects if a provider with providerId is not
		 * registered, or if the user does not consent to sharing authentication information with
		 * the extension. If there are multiple sessions with the same scopes, the user will be shown a
		 * quickpick to select which account they would like to use.
		 * @param providerId The id of the provider to use
		 * @param scopes A list of scopes representing the permissions requested. These are dependent on the authentication provider
		 * @param options The [getSessionOptions](#GetSessionOptions) to use
		 * @returns A thenable that resolves to an authentication session if available, or undefined if there are no sessions
		 */
        export function getSession(providerId: string, scopes: string[], options: AuthenticationGetSessionOptions): Thenable<AuthenticationSession2 | undefined>;

		/**
		 * @deprecated
		 * Get existing authentication sessions. Rejects if a provider with providerId is not
		 * registered, or if the user does not consent to sharing authentication information with
		 * the extension.
		 * @param providerId The id of the provider to use
		 * @param scopes A list of scopes representing the permissions requested. These are dependent on the authentication
		 * provider
		 */
        export function getSessions(providerId: string, scopes: string[]): Thenable<ReadonlyArray<AuthenticationSession>>;

		/**
		 * @deprecated
		* Prompt a user to login to create a new authenticaiton session. Rejects if a provider with
		* providerId is not registered, or if the user does not consent to sharing authentication
		* information with the extension.
		* @param providerId The id of the provider to use
		* @param scopes A list of scopes representing the permissions requested. These are dependent on the authentication
		* provider
		*/
        export function login(providerId: string, scopes: string[]): Thenable<AuthenticationSession>;

		/**
		 * @deprecated
		* Logout of a specific session.
		* @param providerId The id of the provider to use
		* @param sessionId The session id to remove
		* provider
		*/
        export function logout(providerId: string, sessionId: string): Thenable<void>;

		/**
		* An [event](#Event) which fires when the array of sessions has changed, or data
		* within a session has changed for a provider. Fires with the ids of the providers
		* that have had session data change.
		*/
        export const onDidChangeSessions: Event<{ [providerId: string]: AuthenticationSessionsChangeEvent; }>;
    }
    //#endregion
}

