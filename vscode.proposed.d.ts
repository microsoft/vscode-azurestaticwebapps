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
        readonly displayName: string;

		/**
		 * Whether it is possible to be signed into multiple accounts at once.
		 */
        supportsMultipleAccounts: boolean;

		/**
		 * An [event](#Event) which fires when the array of sessions has changed, or data
		 * within a session has changed.
		 */
        readonly onDidChangeSessions: Event<AuthenticationSessionsChangeEvent>;

		/**
		 * Returns an array of current sessions.
		 */
        getSessions(): Thenable<ReadonlyArray<AuthenticationSession>>;

		/**
		 * Prompts a user to login.
		 */
        login(scopes: string[]): Thenable<AuthenticationSession>;
        logout(sessionId: string): Thenable<void>;
    }

    export namespace authentication {
        export function registerAuthenticationProvider(provider: AuthenticationProvider): Disposable;

		/**
		 * Fires with the provider id that was registered or unregistered.
		 */
        export const onDidChangeAuthenticationProviders: Event<AuthenticationProvidersChangeEvent>;

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
		 */
        export function hasSessions(providerId: string, scopes: string[]): Thenable<boolean>;

        export interface GetSessionOptions {
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
		 * Get an authentication session matching the desired scopes. Rejects if a provider with providerId is not
		 * registered, or if the user does not consent to sharing authentication information with
		 * the extension. If there are multiple sessions with the same scopes, the user will be shown a
		 * quickpick to select which account they would like to use.
		 * @param providerId The id of the provider to use
		 * @param scopes A list of scopes representing the permissions requested. These are dependent on the authentication provider
		 * @param options The [getSessionOptions](#GetSessionOptions) to use
		 */
        export function getSession(providerId: string, scopes: string[], options: GetSessionOptions): Thenable<AuthenticationSession | undefined>;

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
}
