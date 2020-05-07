# Azure Static Web Apps (Preview) for Visual Studio Code (Preview)

[![Version](https://vsmarketplacebadge.apphb.com/version/ms-azuretools.vscode-azurestaticwebapps.svg)](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurestaticwebapps) [![Installs](https://vsmarketplacebadge.apphb.com/installs-short/ms-azuretools.vscode-azurestaticwebapps.svg)](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurestaticwebapps) [![Build Status](https://dev.azure.com/ms-azuretools/AzCode/_apis/build/status/vscode-azurestaticwebapps)](https://dev.azure.com/ms-azuretools/AzCodePrivate/_build/latest?definitionId=30)

Use the Azure Static Web Apps (Preview) extension to quickly create and manage Azure Static Web Apps (Preview) directly from VS Code.

**Visit the [wiki](https://github.com/Microsoft/vscode-azurestaticwebapps/wiki) for additional information about the extension.**

> Sign up today for your free Azure account and receive 12 months of free popular services, $200 free credit and 25+ always free services 👉 [Start Free](https://azure.microsoft.com/free/open-source).

## Create your first static web app

1. Select the button to create a new static web app in the Azure Static Web App (Preview) explorer
    **INSERT SCREENSHOT HERE**
1. Authorize VS Code have access to your GitHub account
    **INSERT SCREENSHOT HERE**
1. Select a GitHub repository to configure to the new static web app
    > If your local project has a remote configured, the extension will default to that repository
1. Provide the app, api, and build artifact folder names

## Create an API for your static web app
This extension has a dependancy on the [Azure Functions Extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurefunctions) to create APIs and endpoints.  Your SPA project needs to have an "api" folder that contains all of the endpoints.

1. Open your SPA project in your VS Code workspace
1. Select the button to create a new API
    **INSERT SCREENSHOT HERE**
1. Select a language for the API, either JavaScript or TypeScript
1. Click "Yes" to creating an endpoint

## Updating your static web app

1. Commit and push your changes to the GitHub repository that your static web app is configured to.  It will then use [GitHub Actions](https://github.com/features/actions) to update your app.
    > If you create a PR, GitHub Actions will create a staging environment with your new changes.  Manage these builds under the "Environments" tree item.
    **INSERT SCREENSHOT HERE**

## Contributing

There are a couple of ways you can contribute to this repo:

* **Ideas, feature requests and bugs**: We are open to all ideas and we want to get rid of bugs! Use the Issues section to either report a new issue, provide your ideas or contribute to existing threads.
* **Documentation**: Found a typo or strangely worded sentences? Submit a PR!
* **Code**: Contribute bug fixes, features or design changes:
  * Clone the repository locally and open in VS Code.
  * Install [TSLint for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-tslint-plugin).
  * Open the terminal (press `CTRL+`\`) and run `npm install`.
  * To build, press `F1` and type in `Tasks: Run Build Task`.
  * Debug: press `F5` to start debugging the extension.

### Legal

Before we can accept your pull request you will need to sign a **Contribution License Agreement**. All you need to do is to submit a pull request, then the PR will get appropriately labelled (e.g. `cla-required`, `cla-norequired`, `cla-signed`, `cla-already-signed`). If you already signed the agreement we will continue with reviewing the PR, otherwise system will tell you how you can sign the CLA. Once you sign the CLA all future PR's will be labeled as `cla-signed`.

### Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Telemetry

VS Code collects usage data and sends it to Microsoft to help improve our products and services. Read our [privacy statement](https://go.microsoft.com/fwlink/?LinkID=528096&clcid=0x409) to learn more. If you don’t wish to send usage data to Microsoft, you can set the `telemetry.enableTelemetry` setting to `false`. Learn more in our [FAQ](https://code.visualstudio.com/docs/supporting/faq#_how-to-disable-telemetry-reporting).

## License

[MIT](LICENSE.md)
