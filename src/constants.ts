/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { MessageItem } from "vscode";
import { localize } from "./utils/localize";

export const githubApiEndpoint: string = 'https://api.github.com';

export const defaultAppLocation: string = '/';
export const defaultApiLocation: string = 'api';
export const productionEnvironmentName: string = 'Production';

export const appSubpathSetting: string = 'appSubpath';
export const apiSubpathSetting: string = 'apiSubpath';
export const appArtifactSubpathSetting: string = 'appArtifactSubpath';
export const outputSubpathSetting: string = 'outputSubpath';

export const showActionsMsg: MessageItem = { title: localize('openActions', 'Open Actions in GitHub') };
