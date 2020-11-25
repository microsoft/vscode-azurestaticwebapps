/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fse from 'fs-extra';
import * as os from 'os';
import { join } from 'path';
import { AzureWizardPromptStep } from 'vscode-azureextensionui';
import { ext } from '../../extensionVariables';
import { localize } from '../../utils/localize';
import { nonNullProp } from '../../utils/nonNull';
import { IStaticWebAppWizardContext } from '../createStaticWebApp/IStaticWebAppWizardContext';

export class GitignoreListStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {

    public async prompt(wizardContext: IStaticWebAppWizardContext): Promise<void> {
        const fsPath: string = nonNullProp(wizardContext, 'fsPath');
        const gitignorePath: string = join(fsPath, '.gitignore');
        const files: string[] = (await fse.readdir(fsPath))
            .filter(name => name !== '.git');
        const placeHolder: string = localize('ignore', 'Select which files should be included in the repository.');
        const result: { label: string }[] = await ext.ui.showQuickPick(files.map(name => ({ label: name })), { placeHolder, canPickMany: true });

        const ignored: Set<string> = new Set(files);
        result.forEach(file => ignored.delete(file.label));

        // if the user selected every file, write a blank .gitignore
        const data: string = [...ignored].map(i => `/${i}`).join(os.EOL);
        await fse.writeFile(gitignorePath, data);
    }

    public shouldPrompt(wizardContext: IStaticWebAppWizardContext): boolean {
        return wizardContext.gitignoreExists === false;
    }
}
