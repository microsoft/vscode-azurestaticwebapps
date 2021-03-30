/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "vscode-azureextensionui";
import { getWorkspaceFolder } from "../../utils/workspaceUtils";
import { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";

export class CloneRepoStep extends AzureWizardPromptStep<IStaticWebAppWizardContext> {
    public async prompt(_wizardContext: IStaticWebAppWizardContext): Promise<void> {

        const returnType = await getWorkspaceFolder(_wizardContext);
        console.log(returnType);
    }

    public shouldPrompt(_wizardContext: IStaticWebAppWizardContext): boolean {
        return true;
    }

}
