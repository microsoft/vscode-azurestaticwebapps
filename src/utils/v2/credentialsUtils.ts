import { AzExtServiceClientCredentials, ISubscriptionContext } from '@microsoft/vscode-azext-utils';
import * as vscode from 'vscode';
import { localize } from '../../utils/localize';
import { ApplicationSubscription } from '../../vscode-azureresourcegroups.api.v2';

/**
 * Converts a VS Code authentication session to an Azure Track 1 & 2 compatible compatible credential.
 */
export function createCredential(getSession: (scopes?: string[]) => vscode.ProviderResult<vscode.AuthenticationSession>): AzExtServiceClientCredentials {
    return {
        getToken: async (scopes?: string | string[]) => {
            if (typeof scopes === 'string') {
                scopes = [scopes];
            }

            const session = await getSession(scopes);

            if (session) {
                return {
                    token: session.accessToken
                };
            } else {
                return null;
            }
        },
        signRequest: async () => {
            throw new Error((localize('signRequestError', 'Track 1 credentials are not (currently) supported.')));
        }
    };
}

/**
 * Creates a subscription context from an application subscription.
 */
export function createSubscriptionContext(subscription: ApplicationSubscription): ISubscriptionContext {
    return {
        subscriptionDisplayName: '',
        subscriptionPath: '',
        tenantId: '',
        userId: '',
        ...subscription,
        credentials: createCredential(subscription.authentication.getSession)
    };
}
