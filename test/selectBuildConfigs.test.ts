/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createTestActionContext } from '@microsoft/vscode-azext-dev';
import * as assert from 'assert';
import { Position, Range, TextDocument, TextDocumentContentProvider, Uri, workspace } from 'vscode';
import { BuildConfig, tryGetSelection } from "../extension.bundle";

interface ISelectBuildConfigTestCase {
    workflowIndex: number;
    buildConfig: BuildConfig;
    expectedSelection: {
        line: number;
        startChar: number;
        endChar: number;
    } | undefined;
}

suite('Select Build Configurations in GitHub Workflow Files', () => {
    const testCases: ISelectBuildConfigTestCase[] = [
        { workflowIndex: 0, buildConfig: 'api_location', expectedSelection: { line: 7, startChar: 24, endChar: 26 } },
        { workflowIndex: 0, buildConfig: 'app_location', expectedSelection: { line: 6, startChar: 24, endChar: 27 } },
        { workflowIndex: 0, buildConfig: 'output_location', expectedSelection: { line: 8, startChar: 27, endChar: 29 } },
        { workflowIndex: 0, buildConfig: 'app_artifact_location', expectedSelection: undefined },

        { workflowIndex: 1, buildConfig: 'api_location', expectedSelection: { line: 7, startChar: 24, endChar: 38 } },
        { workflowIndex: 1, buildConfig: 'app_location', expectedSelection: { line: 6, startChar: 24, endChar: 38 } },
        { workflowIndex: 1, buildConfig: 'output_location', expectedSelection: undefined },
        { workflowIndex: 1, buildConfig: 'app_artifact_location', expectedSelection: { line: 8, startChar: 33, endChar: 54 } },

        { workflowIndex: 2, buildConfig: 'api_location', expectedSelection: { line: 7, startChar: 24, endChar: 50 } },
        { workflowIndex: 2, buildConfig: 'app_location', expectedSelection: { line: 6, startChar: 24, endChar: 30 } },
        { workflowIndex: 2, buildConfig: 'output_location', expectedSelection: { line: 8, startChar: 27, endChar: 40 } },
        { workflowIndex: 2, buildConfig: 'app_artifact_location', expectedSelection: undefined },

        { workflowIndex: 3, buildConfig: 'api_location', expectedSelection: undefined },
        { workflowIndex: 3, buildConfig: 'app_location', expectedSelection: undefined },
        { workflowIndex: 3, buildConfig: 'output_location', expectedSelection: undefined },
        { workflowIndex: 3, buildConfig: 'app_artifact_location', expectedSelection: undefined },

        { workflowIndex: 4, buildConfig: 'api_location', expectedSelection: { line: 30, startChar: 24, endChar: 39 } },
        { workflowIndex: 4, buildConfig: 'app_location', expectedSelection: { line: 29, startChar: 24, endChar: 57 } },
        { workflowIndex: 4, buildConfig: 'output_location', expectedSelection: { line: 31, startChar: 27, endChar: 54 } },
        { workflowIndex: 4, buildConfig: 'app_artifact_location', expectedSelection: undefined },
    ];

    const workflowProvider: TextDocumentContentProvider = new (class implements TextDocumentContentProvider {
        provideTextDocumentContent(uri: Uri): string {
            return workflows[parseInt(uri.path)];
        }
    })();
    const scheme: string = 'testWorkflows';
    workspace.registerTextDocumentContentProvider(scheme, workflowProvider);

    for (const testCase of testCases) {
        const title: string = `Workflow ${testCase.workflowIndex}: ${testCase.buildConfig}`;

        test(title, async () => {
            const uri: Uri = Uri.parse(`${scheme}:${testCase.workflowIndex}`);
            const configDocument: TextDocument = await workspace.openTextDocument(uri);
            const selection: Range | undefined = await tryGetSelection(await createTestActionContext(), configDocument, testCase.buildConfig);
            let expectedSelection: Range | undefined;

            if (testCase.expectedSelection) {
                const expectedStart: Position = new Position(testCase.expectedSelection.line, testCase.expectedSelection.startChar);
                const expectedEnd: Position = new Position(testCase.expectedSelection.line, testCase.expectedSelection.endChar);
                expectedSelection = new Range(expectedStart, expectedEnd);
            }

            assert.ok(selection && expectedSelection && selection.isEqual(expectedSelection) || selection === expectedSelection, 'Actual and expected selections do not match');
        });
    }
});

const workflows: string[] = [
    `jobs:
  build_and_deploy_job:
    steps:
      - uses: Azure/static-web-apps-deploy@v0.0.1-preview
        id: builddeploy
        with:
          app_location: "/"
          api_location: ""
          output_location: ""`,

    `jobs:
  build_and_deploy_job:
    steps:
      - uses: Azure/static-web-apps-deploy@v0.0.1-preview
        id: builddeploy
        with:
          app_location: "app/location"
          api_location: 'api/location'
          app_artifact_location: app/artifact/location`,

    `jobs:
  build_and_deploy_job:
    steps:
      - uses: Azure/static-web-apps-deploy@v0.0.1-preview
        id: builddeploy
        with:
          app_location: 你会说中文吗 # 你会说中文吗
          api_location: $p3c!@L-ÇhärãçΤΕrs &()%^*? # Comment
          output_location: "한국어 할 줄 아세요"`,

    `jobs:
  build_and_deploy_job1:
    steps:
      - uses: Azure/static-web-apps-deploy@v0.0.1-preview
        id: builddeploy
        with:
            app_location: "src"
            api_location: "api"
            output_location: "build"

  build_and_deploy_job2:
    steps:
      - uses: Azure/static-web-apps-deploy@v0.0.1-preview
        id: builddeploy
        with:
          app_location: "src"
          api_location: "api"
          output_location: "build"`,

    `name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - master
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - master

jobs:
  build_and_deploy_job:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - uses: actions/checkout@v2
        with:
          submodules: true
      - name: Build And Deploy
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v0.0.1-preview
        with:
          azure_static_web_apps_api_token: $\{{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_AMBITIOUS_ROCK_0D992521E }}
          repo_token: $\{{ secrets.GITHUB_TOKEN }} # Used for Github integrations (i.e. PR comments)
          action: "upload"
          ###### Repository/Build Configurations - These values can be configured to match your app requirements. ######
          # For more information regarding Static Web App workflow configurations, please visit: https://aka.ms/swaworkflowconfig
          app_location: "super/long/path/to/app/location"		# There are tabs before this comment
          api_location: 'single/quotes'                         #There are spaces before this comment
          output_location: output/location with/spaces # There is a single space before this comment
          ###### End of Repository/Build Configurations ######

  close_pull_request_job:
    if: github.event_name == 'pull_request' && github.event.action == 'closed'
    runs-on: ubuntu-latest
    name: Close Pull Request Job
    steps:
      - name: Close Pull Request
        id: closepullrequest
        uses: Azure/static-web-apps-deploy@v0.0.1-preview
        with:
          azure_static_web_apps_api_token: $\{{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_AMBITIOUS_ROCK_0D992521E }}
          action: "close"

`];
