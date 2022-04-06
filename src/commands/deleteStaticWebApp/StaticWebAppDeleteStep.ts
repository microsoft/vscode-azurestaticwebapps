/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardExecuteStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import { Progress } from "vscode";
import { IDeleteWizardContext } from "./IDeleteWizardContext";

export class StaticWebAppDeleteStep extends AzureWizardExecuteStep<IDeleteWizardContext> {
    public priority: number = 250;

    public async execute(context: IDeleteWizardContext, _progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        await nonNullProp(context, 'node').deleteTreeItem(context);
    }

    public shouldExecute(_wizardContext: IDeleteWizardContext): boolean {
        return true;
    }
}
