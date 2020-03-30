import { Progress } from 'vscode';
import { AzureWizardExecuteStep } from "vscode-azureextensionui";
import { githubApiEndpoint } from '../../constants';
import { createGitHubRequestOptions, gitHubWebResource } from "../../github/connectToGitHub";
import { requestUtils } from '../../utils/requestUtils';
import { INewEndpointWizardContext } from "./INewEndpointWizardContext";

export class RepoCreateStep extends AzureWizardExecuteStep<INewEndpointWizardContext> {
    public priority: number = 200;

    public async execute(wizardContext: INewEndpointWizardContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        progress.report({ message: 'Creating new github repo' });
        const requestOption: gitHubWebResource = await createGitHubRequestOptions(wizardContext, `${githubApiEndpoint}/user/repos`, 'POST');
        requestOption.body = JSON.stringify({ name: wizardContext.newRepoName });

        try {
            const reponse = await requestUtils.sendRequest(requestOption);
            console.log('poop');
        } catch (err) {
            throw err;
        }

        progress.report({ message: 'Created new github repo' });

    }

    public shouldExecute(wizardContext: INewEndpointWizardContext): boolean {
        return !!(wizardContext.accessToken && wizardContext.newRepoName);
    }

}
