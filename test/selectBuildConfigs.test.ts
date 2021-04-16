/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { join } from 'path';
import { Position, Range, TextDocument, workspace } from "vscode";
import { BuildConfig, getSelection } from "../extension.bundle";
import { getWorkspacePath } from './utils/workspaceUtils';

interface ISelectBuildConfigTestCase {
    workflowFileName: string;
    buildConfig: BuildConfig;
    expectedSelection: undefined | {
        line: number;
        startChar: number;
        endChar: number;
    }
}

suite('Select Build Configurations in GitHub Workflow Files', () => {
    const testCases: ISelectBuildConfigTestCase[] = [
        { workflowFileName: 'workflow-simple.yml', buildConfig: 'api_location', expectedSelection: { line: 30, startChar: 24, endChar: 26 } },
        { workflowFileName: 'workflow-simple.yml', buildConfig: 'app_location', expectedSelection: { line: 29, startChar: 24, endChar: 27 } },
        { workflowFileName: 'workflow-simple.yml', buildConfig: 'output_location', expectedSelection: { line: 31, startChar: 27, endChar: 29 } },
        { workflowFileName: 'workflow-simple.yml', buildConfig: 'app_artifact_location', expectedSelection: undefined },

        { workflowFileName: 'workflow-funky.yml', buildConfig: 'api_location', expectedSelection: { line: 30, startChar: 24, endChar: 39 } },
        { workflowFileName: 'workflow-funky.yml', buildConfig: 'app_location', expectedSelection: { line: 29, startChar: 24, endChar: 57 } },
        { workflowFileName: 'workflow-funky.yml', buildConfig: 'output_location', expectedSelection: { line: 31, startChar: 27, endChar: 54 } },
        { workflowFileName: 'workflow-funky.yml', buildConfig: 'app_artifact_location', expectedSelection: undefined },

        { workflowFileName: 'workflow-old.yml', buildConfig: 'api_location', expectedSelection: { line: 30, startChar: 24, endChar: 29 } },
        { workflowFileName: 'workflow-old.yml', buildConfig: 'app_location', expectedSelection: { line: 29, startChar: 24, endChar: 29 } },
        { workflowFileName: 'workflow-old.yml', buildConfig: 'output_location', expectedSelection: undefined },
        { workflowFileName: 'workflow-old.yml', buildConfig: 'app_artifact_location', expectedSelection: { line: 31, startChar: 33, endChar: 38 } },

        { workflowFileName: 'workflow-duplicates.yml', buildConfig: 'api_location', expectedSelection: undefined },
        { workflowFileName: 'workflow-duplicates.yml', buildConfig: 'app_location', expectedSelection: undefined },
        { workflowFileName: 'workflow-duplicates.yml', buildConfig: 'output_location', expectedSelection: undefined },
        { workflowFileName: 'workflow-duplicates.yml', buildConfig: 'app_artifact_location', expectedSelection: undefined },
    ];

    for (const testCase of testCases) {
        const title: string = `${testCase.workflowFileName}: ${testCase.buildConfig}`;
        const workspacePath: string = getWorkspacePath('testWorkspace');

        test(title, async () => {
            const configDocument: TextDocument = await workspace.openTextDocument(join(workspacePath, 'testWorkflows', testCase.workflowFileName));
            const selection: Range | undefined = await getSelection(configDocument, testCase.buildConfig);
            let expectedSelection: Range | undefined;

            if (testCase.expectedSelection) {
                const expectedStart: Position = new Position(testCase.expectedSelection.line, testCase.expectedSelection.startChar);
                const expectedEnd: Position = new Position(testCase.expectedSelection.line, testCase.expectedSelection.endChar);
                expectedSelection = new Range(expectedStart, expectedEnd);
            }

            assert.ok(expectedSelection && selection?.isEqual(expectedSelection) || selection === expectedSelection, 'Actual and expected selections do not match');
        });
    }
});
