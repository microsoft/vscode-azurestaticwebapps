/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// tslint:disable:no-console
// tslint:disable:no-implicit-dependencies (this allows the use of dev dependencies)

// Grandfathered in
// tslint:disable:typedef
// tslint:disable:no-unsafe-any

import * as cp from 'child_process';
import * as fse from 'fs-extra';
import * as gulp from 'gulp';
import * as path from 'path';
import { gulp_installAzureAccount, gulp_webpack } from 'vscode-azureextensiondev';

function test() {
    const env = process.env;
    env.DEBUGTELEMETRY = 'v';
    env.MOCHA_timeout = String(20 * 1000);
    env.CODE_TESTS_WORKSPACE = path.join(__dirname, 'test/test.code-workspace');
    env.CODE_TESTS_PATH = path.join(__dirname, 'dist/test');
    return cp.spawn('node', ['./node_modules/vscode/bin/test'], { stdio: 'inherit', env });
}

async function listIcons() {
    const rootPath: string = path.join(__dirname, 'resources', 'providers');
    const subDirs: string[] = (await fse.readdir(rootPath)).filter(dir => dir.startsWith('microsoft.'));
    // tslint:disable-next-line: no-constant-condition
    while (true) {
        const subDir: string | undefined = subDirs.pop();
        if (!subDir) {
            break;
        } else {
            const subDirPath: string = path.join(rootPath, subDir);
            const paths: string[] = await fse.readdir(subDirPath);
            for (const p of paths) {
                const subPath: string = path.posix.join(subDir, p);
                if (subPath.endsWith('.svg')) {
                    console.log(`'${subPath.slice(0, -4)}',`);
                } else {
                    subDirs.push(subPath);
                }
            }
        }
    }
}

exports['webpack-dev'] = () => gulp_webpack('development');
exports['webpack-prod'] = () => gulp_webpack('production');
exports.test = gulp.series(gulp_installAzureAccount, test);
exports.listIcons = listIcons;
