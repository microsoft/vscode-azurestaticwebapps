/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fse from 'fs-extra';
import { join } from "path";
import { IActionContext } from "vscode-azureextensionui";
import { remoteShortnameExists } from "../../utils/gitHubUtils";
import { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";

export async function setWorkspaceContexts(wizardContext: IActionContext & Partial<IStaticWebAppWizardContext>, fsPath: string): Promise<void> {
    const origin: string = 'origin';
    wizardContext.originExists = await remoteShortnameExists(fsPath, origin);
    wizardContext.newRemoteShortname = wizardContext.originExists ? undefined : origin;
    const gitignorePath: string = join(fsPath, '.gitignore');
    wizardContext.gitignoreExists = await fse.pathExists(gitignorePath);
}
