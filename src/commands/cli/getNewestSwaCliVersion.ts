/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzExtPipelineResponse, sendRequestWithTimeout } from "@microsoft/vscode-azext-azureutils";
import { IActionContext } from "@microsoft/vscode-azext-utils";
import { swaCliPackageName } from "../../constants";
import { localize } from "../../utils/localize";

interface IPackageMetadata {
    "dist-tags": {
        [tag: string]: string;
        latest: string;
    }
}

export async function getNewestSwaCliVersion(context: IActionContext): Promise<string | undefined> {
    try {
        const response: AzExtPipelineResponse = await sendRequestWithTimeout(context, {
            method: 'GET',
            url: `https://registry.npmjs.org/${swaCliPackageName}`
        }, 15000, undefined);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const packageMetadata: IPackageMetadata = <IPackageMetadata>response.parsedBody;
        return packageMetadata["dist-tags"].latest;
    } catch (error) {
        throw new Error(localize('noLatestTag', 'Failed to retrieve then latest version of the Azure Static Web Apps CLI.'));
    }
}
