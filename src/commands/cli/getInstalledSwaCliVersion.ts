/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as semver from 'semver';
import { cpUtils } from "../../utils/cpUtils";

export async function getInstalledSwaCliVersion(workingDirectory?: string): Promise<string | null> {
    try {
        // npx --global --no-install swa --version
        // --global makes command only check for globally installed modules
        // without --global, the command checks locally installed modules first, then globally installed modules
        // --no-install makes command exit with non-zero exit code if the CLI is not found
        const output: string = await cpUtils.executeCommand(undefined, workingDirectory, 'npx', '--global', '--no-install', 'swa', '--version');
        return semver.clean(output);
    } catch (e) {
        return null;
    }
}
