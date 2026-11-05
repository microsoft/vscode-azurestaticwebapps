/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { StaticSiteBuildARMResource, WebSiteManagementClient } from '@azure/arm-appservice';
import { AppSettingsTreeItem } from '@microsoft/vscode-azext-azureappsettings';
import { AzExtParentTreeItem, AzExtTreeDataProvider, AzExtTreeItem, createTestActionContext, ISubscriptionContext, registerUIExtensionVariables } from '@microsoft/vscode-azext-utils';
import * as assert from 'assert';
import { readFileSync } from 'fs';
import { mock } from 'node:test';
import { join } from 'path';
import { commands, ExtensionContext, extensions } from 'vscode';
import { SwaAppSettingsClient, SwaAppSettingsClientProvider } from '../src/commands/appSettings/AppSettingsClient';
import { cloneRepo } from '../src/commands/github/cloneRepo';
import { openGitHubRepo } from '../src/commands/github/openGitHubRepo';
import { showActions } from '../src/commands/github/showActions';
import { openYAMLConfigFile } from '../src/commands/openYAMLConfigFile';
import { onlyGitHubSupported, productionEnvironmentName } from '../src/constants';
import { ext } from '../src/extensionVariables';
import { EnvironmentTreeItem } from '../src/tree/EnvironmentTreeItem';
import { FunctionsTreeItem } from '../src/tree/FunctionsTreeItem';
import { StaticWebAppTreeItem } from '../src/tree/StaticWebAppTreeItem';
import { getGitHubRepositoryUrl, isGitHubRepositoryUrl } from '../src/utils/gitUtils';

class TestParentTreeItem extends AzExtParentTreeItem {
    public label: string = 'test';
    public contextValue: string = 'test';

    public async loadMoreChildrenImpl(): Promise<AzExtTreeItem[]> {
        return [];
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }
}

suite('Unlinked Static Web App resources', () => {
    const repositoryUrl = 'https://github.com/test/app';
    const resourceId = '/subscriptions/test/resourceGroups/test/providers/Microsoft.Web/staticSites/app';

    suiteSetup(() => {
        const extension = extensions.getExtension('ms-azuretools.vscode-azurestaticwebapps');
        assert.ok(extension);
        ext.context = { extension, extensionUri: extension.extensionUri } as ExtensionContext;
        registerUIExtensionVariables(ext);
    });

    async function createResource(url?: string, branch?: string): Promise<StaticWebAppTreeItem> {
        const credentials = { getToken: async () => { throw new Error('Unexpected Azure authentication'); } };
        const subscription: ISubscriptionContext = {
            subscriptionId: 'test',
            subscriptionDisplayName: 'test',
            subscriptionPath: '/subscriptions/test',
            tenantId: 'test',
            userId: 'test',
            isCustomCloud: false,
            credentials,
            createCredentialsForScopes: async () => credentials,
            environment: { resourceManagerEndpointUrl: 'https://management.azure.com' } as ISubscriptionContext['environment']
        };
        return new StaticWebAppTreeItem(await createTestActionContext(), subscription, {
            id: resourceId,
            name: 'app',
            type: 'Microsoft.Web/staticSites',
            location: 'westus2',
            repositoryUrl: url,
            branch,
            defaultHostname: 'app.azurestaticapps.net'
        });
    }

    async function createEnvironment(url?: string, data: Partial<StaticSiteBuildARMResource> = {}): Promise<EnvironmentTreeItem> {
        const resource = await createResource(url, data.sourceBranch);
        const parent = Object.assign(new TestParentTreeItem(undefined), resource);
        return new EnvironmentTreeItem(parent, {
            id: `${resourceId}/builds/default`,
            name: 'default',
            buildId: 'default',
            hostname: 'app.azurestaticapps.net',
            status: 'Ready',
            ...data
        });
    }

    test('Loads a resource without repository or branch metadata', async () => {
        const resource = await createResource();
        assert.strictEqual(resource.name, 'app');
        assert.strictEqual(resource.description, undefined);
        assert.strictEqual(resource.repositoryUrl, undefined);
        assert.strictEqual(resource.branch, undefined);
        assert.ok(resource.contextValuesToAdd?.includes('noGitHub'));
    });

    test('Preserves GitHub-linked resource metadata', async () => {
        const resource = await createResource(repositoryUrl, 'main');
        assert.strictEqual(resource.description, 'test/app');
        assert.strictEqual(resource.branch, 'main');
        assert.ok(!resource.contextValuesToAdd?.includes('noGitHub'));
    });

    test('Uses valid when clauses for resource context menus', async () => {
        const manifest: { contributes: { menus: Record<string, { command: string; when: string }[]> } } =
            JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));
        const menus = manifest.contributes.menus['view/item/context'];
        const errors = await commands.executeCommand<unknown[][]>('_validateWhenClauses', menus.map(item => item.when));
        assert.ok(errors);
        for (let i = 0; i < menus.length; i++) {
            assert.deepStrictEqual(errors[i], [], `Invalid when clause for ${menus[i].command}: ${menus[i].when}`);
        }
    });

    test('Hides Clone Repository on resources without a GitHub connection', () => {
        const manifest: { contributes: { menus: Record<string, { command: string; when: string }[]> } } =
            JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));
        const cloneMenu = manifest.contributes.menus['view/item/context'].find(item => item.command === 'staticWebApps.cloneRepo');
        assert.ok(cloneMenu?.when.includes('!(viewItem =~ /noGitHub/)'));
    });

    test('Loads production without a source branch', async () => {
        const environment = await createEnvironment();
        assert.strictEqual(environment.label, productionEnvironmentName);
        assert.strictEqual(environment.description, undefined);
        assert.strictEqual(environment.isProduction, true);
        assert.strictEqual(environment.inWorkspace, false);
        assert.ok(environment.contextValue.includes('noGitHub'));
    });

    test('Uses the build ID for manually deployed preview environments', async () => {
        const environment = await createEnvironment(undefined, { name: 'staging', buildId: 'staging' });
        assert.strictEqual(environment.label, 'staging');
        assert.strictEqual(environment.isProduction, false);
    });

    test('Displays deployment status without an undefined branch', async () => {
        const environment = await createEnvironment(undefined, { status: 'Uploading' });
        assert.strictEqual(environment.description, 'Uploading');
    });

    for (const { response, description } of [
        { response: '{"sourceBranch":null,"status":"Ready"}', description: undefined },
        { response: '{"sourceBranch":null,"status":"Uploading"}', description: 'Uploading' },
        { response: '{"sourceBranch":null,"status":null}', description: undefined },
        { response: '{"sourceBranch":"main","status":null}', description: 'main' }
    ]) {
        test(`Renders a valid environment tree item for Azure response ${response}`, async () => {
            const environment = await createEnvironment(undefined, JSON.parse(response));
            const provider = new AzExtTreeDataProvider(environment.parent, 'test.loadMore');
            try {
                const treeItem = provider.getTreeItem(environment);
                assert.strictEqual(treeItem.label, productionEnvironmentName);
                assert.strictEqual(treeItem.description, description);
                assert.ok(treeItem.description === undefined || typeof treeItem.description === 'string');
                assert.strictEqual(environment.branch, JSON.parse(response).sourceBranch ?? undefined);
            } finally {
                provider.dispose();
            }
        });
    }

    test('Preserves GitHub preview branch and title formatting', async () => {
        const environment = await createEnvironment(repositoryUrl, {
            buildId: '42',
            sourceBranch: 'contributor:feature',
            pullRequestTitle: 'Feature'
        });
        assert.strictEqual(environment.branch, 'feature');
        assert.strictEqual(environment.label, 'Feature');
        assert.strictEqual(environment.description, 'feature');
        assert.strictEqual(environment.contextValue, EnvironmentTreeItem.contextValue);
    });

    test('Keeps API settings and functions available without GitHub actions', async () => {
        const environment = await createEnvironment();
        environment.appSettingsTreeItem = new AppSettingsTreeItem(environment, new SwaAppSettingsClientProvider(environment), ext.prefix);
        environment.functionsTreeItem = new FunctionsTreeItem(environment);
        const children = await environment.loadMoreChildrenImpl(false, await createTestActionContext());
        assert.deepStrictEqual(children, [environment.appSettingsTreeItem, environment.functionsTreeItem]);
        assert.strictEqual(environment.pickTreeItemImpl([FunctionsTreeItem.contextValue]), environment.functionsTreeItem);
        const settingsClient = new SwaAppSettingsClient(environment, {} as WebSiteManagementClient);
        assert.strictEqual(settingsClient.fullName, `app/${productionEnvironmentName}`);
    });

    test('Shows API guidance without GitHub actions for resources with no API', async () => {
        const environment = await createEnvironment();
        const children = await environment.loadMoreChildrenImpl(false, await createTestActionContext());
        assert.deepStrictEqual(children.map(child => child.contextValue), ['noFunctions']);
    });

    for (const url of [undefined, 'https://dev.azure.com/org/project/_git/repo', repositoryUrl]) {
        test(`Refreshes Azure functionality without GitHub authentication for ${url || 'an unlinked resource'}`, async () => {
            const environment = await createEnvironment(url);
            const requestMock = mock.method(WebSiteManagementClient.prototype, 'sendOperationRequest', async (_args: unknown, operationSpec: { httpMethod: string }) => {
                return operationSpec.httpMethod === 'GET' ? environment.data : { properties: {} };
            });
            try {
                const context = await createTestActionContext();
                await environment.refreshImpl(context);
                const children = await environment.loadMoreChildrenImpl(false, context);
                assert.strictEqual(requestMock.mock.callCount(), 2);
                assert.strictEqual(environment.actionsTreeItem, undefined);
                assert.strictEqual(environment.inWorkspace, false);
                assert.deepStrictEqual(environment.gitHubConfigGroupTreeItems, []);
                assert.ok(environment.appSettingsTreeItem);
                assert.ok(environment.functionsTreeItem);
                assert.deepStrictEqual(children, [environment.appSettingsTreeItem, environment.functionsTreeItem]);
            } finally {
                requestMock.mock.restore();
            }
        });
    }

    test('Retains GitHub actions when a repository and source branch are present', async () => {
        const environment = await createEnvironment(repositoryUrl, { sourceBranch: 'main' });
        const requestMock = mock.method(WebSiteManagementClient.prototype, 'sendOperationRequest', async (_args: unknown, operationSpec: { httpMethod: string }) => {
            return operationSpec.httpMethod === 'GET' ? environment.data : { properties: {} };
        });
        try {
            const context = await createTestActionContext();
            await environment.refreshImpl(context);
            assert.ok(environment.actionsTreeItem);
            assert.strictEqual(environment.actionsTreeItem.repositoryUrl, repositoryUrl);
            assert.deepStrictEqual(await environment.loadMoreChildrenImpl(false, context), [
                environment.actionsTreeItem,
                environment.appSettingsTreeItem,
                environment.functionsTreeItem
            ]);
        } finally {
            requestMock.mock.restore();
        }
    });

    test('Rejects GitHub commands explicitly when invoked on an unlinked resource', async () => {
        const context = await createTestActionContext();
        const resource = await createResource();
        const environment = await createEnvironment();
        await assert.rejects(cloneRepo(context, resource), { message: onlyGitHubSupported });
        await assert.rejects(showActions(context, resource), { message: onlyGitHubSupported });
        await assert.rejects(openGitHubRepo(context, environment), { message: onlyGitHubSupported });
        await assert.rejects(openYAMLConfigFile(context, resource), { message: onlyGitHubSupported });
        await assert.rejects(openYAMLConfigFile(context, environment), { message: onlyGitHubSupported });
    });

    for (const url of [undefined, '', 'https://dev.azure.com/org/project/_git/repo', 'https://gitlab.com/test/app']) {
        test(`Does not enable GitHub features for ${url || 'a missing repository'}`, async () => {
            const resource = await createResource(url);
            assert.ok(resource.contextValuesToAdd?.includes('noGitHub'));
            assert.strictEqual(isGitHubRepositoryUrl(url), false);
            assert.throws(() => getGitHubRepositoryUrl(url), { message: onlyGitHubSupported });
            await assert.rejects(cloneRepo(await createTestActionContext(), resource), { message: onlyGitHubSupported });
            await assert.rejects(showActions(await createTestActionContext(), resource), { message: onlyGitHubSupported });
        });
    }

    for (const url of [repositoryUrl, 'git@github.com:test/app.git', 'https://GitHub.com/test/app']) {
        test(`Recognizes GitHub repository ${url}`, () => {
            assert.strictEqual(isGitHubRepositoryUrl(url), true);
            assert.strictEqual(getGitHubRepositoryUrl(url), url);
        });
    }
});
