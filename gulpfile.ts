/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as gulp from 'gulp';
import * as path from 'path';
import { gulp_installAzureAccount, gulp_installResourceGroups, gulp_installVSCodeExtension, gulp_webpack } from 'vscode-azureextensiondev';
import { AzExtFsExtra } from 'vscode-azureextensionui';

declare let exports: { [key: string]: unknown };

async function prepareForWebpack(): Promise<void> {
    const mainJsPath: string = path.join(__dirname, 'main.js');
    let contents: string = (await AzExtFsExtra.readFile(mainJsPath)).toString();
    contents = contents
        .replace('out/src/extension', 'dist/extension.bundle')
        .replace(', true /* ignoreBundle */', '');
    await AzExtFsExtra.writeFile(mainJsPath, contents);
}

async function gulp_installFunctionsExtension(): Promise<void> {
    return gulp_installVSCodeExtension('ms-azuretools', 'vscode-azurefunctions');
}

async function cleanReadme(): Promise<void> {
    const readmePath: string = path.join(__dirname, 'README.md');
    let data: string = (await AzExtFsExtra.readFile(readmePath)).toString();
    data = data.replace(/<!-- region exclude-from-marketplace -->.*?<!-- endregion exclude-from-marketplace -->/gis, '');
    await AzExtFsExtra.writeFile(readmePath, data);
}

exports['webpack-dev'] = gulp.series(prepareForWebpack, () => gulp_webpack('development'));
exports['webpack-prod'] = gulp.series(prepareForWebpack, () => gulp_webpack('production'));
exports.preTest = gulp.series(gulp_installAzureAccount, gulp_installResourceGroups, gulp_installFunctionsExtension);
exports.cleanReadme = cleanReadme;
