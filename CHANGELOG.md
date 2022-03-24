# Change Log

## 0.10.0 - 2022-03-24

### Added
- Support for creating .NET 6 HTTP Functions [#595](https://github.com/microsoft/vscode-azurestaticwebapps/pull/595)

### Changed
- Minimum version of VS Code is now 1.62.1

### Fixed
-  [Bugs fixed](https://github.com/microsoft/vscode-azurestaticwebapps/milestone/16?closed=1)

## 0.9.1 - 2022-02-22

### Fixed
- Unable to debug non-Node.JS Functions [#618](https://github.com/microsoft/vscode-azurestaticwebapps/pull/618)

## 0.9.0 - 2021-11-11

### Added
- Dynamic debugging to easily debug your static web app using the [Azure Static Web Apps CLI](https://github.com/Azure/static-web-apps-cli) [#557](https://github.com/microsoft/vscode-azurestaticwebapps/pull/557)

    ![Debug static web app with a dynamic configuration](resources/readme/debugging.gif)

- Autocomplete and validation for [swa-cli.config.json](https://github.com/Azure/static-web-apps-cli#swa-cliconfigjson-file) files

- `$swa-watch` problem matcher for Azure Static Web Apps CLI tasks [#531](https://github.com/microsoft/vscode-azurestaticwebapps/pull/531)

### Changed
- Renamed "Edit Configuration" command to "Edit Workflow" [#546](https://github.com/microsoft/vscode-azurestaticwebapps/pull/546)
- Build presets are now grouped in the quick pick to match the portal [#556](https://github.com/microsoft/vscode-azurestaticwebapps/pull/556)
- Placeholder text on the location step has been changed to clarify region/location selection [#554](https://github.com/microsoft/vscode-azurestaticwebapps/pull/554)

### Fixed
-  [Bugs fixed](https://github.com/microsoft/vscode-azurestaticwebapps/milestone/15?closed=1)

## 0.8.1 - 2021-09-27
### Added
- Colored icons to the GitHub action job and step tree nodes
- [Static Web Apps CLI](https://github.com/Azure/static-web-apps-cli)
    - Install or update the CLI using the `Install or Update Azure Static Web Apps CLI` command
    - Uninstall the CLI using the `Uninstall Azure Static Web Apps CLI` command
    - Check for a new version of the CLI on startup

## 0.8.0 - 2021-09-01
### Added
- View GitHub action logs from Actions tree node
- Limited support for [virtual workspaces](https://code.visualstudio.com/updates/v1_56#_remote-repositories-remotehub)
- Learn More buttons (?) for select prompts to help clarify unfamiliar concepts

### Changed
- Minimum version of VS Code is now 1.57.0
- Auto-detects Function API folders for `Create Static Web App...` and `Create HTTP Trigger...`
- Location prompt included in `Create Static Web App...`
- Resource Group prompt is first in `Create Static Web App... (Advanced)`
- Output location default for Angular includes placeholder to add project name

### Fixed
-  [Bugs fixed](https://github.com/microsoft/vscode-azurestaticwebapps/milestone/14?closed=1)

## 0.7.1 - 2021-07-08
### Fixed
-  [Bugs fixed](https://github.com/microsoft/vscode-azurestaticwebapps/milestone/13?closed=1)

## 0.7.0 - 2021-05-12
### Added
- Git project validation prior to `Create Static Web App...`
- After creating a Static Web App, `git pull` is executed to retrieve the [GitHub Actions workflow file](https://aka.ms/AAcg392)
- GitHub Configuration tree item when SWA is connected to local project
- `Create Configuration File` command to add `staticwebapp.config.json`
- Standard SKU option for `Create Static Web App... (Advanced)`

### Changed
- `Create Static Web App...` requires an opened workspace in VS Code
- Location, API location, GitHub org, and repo privacy steps have default values for `Create Static Web App...`
    - Use `Create Static Web App... (Advanced)` for a more customizable creation

### Removed
- (Preview) label 🎉

### Fixed
-  [Bugs fixed](https://github.com/microsoft/vscode-azurestaticwebapps/milestone/12?closed=1)

## 0.6.0 - 2021-04-13
### Added
- Now depends on the "Azure Resources" extension, which provides a "Resource Groups" and "Help and Feedback" view
- IntelliSense for `staticwebapp.config.json` file
- Experimental framework to test incremental changes

### Changed
- "Report an Issue" button was removed from errors. Use the "Help and Feedback" view or command palette instead
- Minimum version of VS Code is now 1.53.0
- Icons updated to match VS Code's theme. Install new product icon themes [here](https://marketplace.visualstudio.com/search?term=tag%3Aproduct-icon-theme&target=VSCode)
- Build presets pre-generate values for app, api, and output locations that must be confirmed

### Fixed
- [Bugs fixed](https://github.com/microsoft/vscode-azurestaticwebapps/milestone/8?closed=1)

## 0.5.0 - 2020-12-02

### Added
- Publish local projects directly to GitHub
- Advanced creation to provide more control when creating static web apps
- Download remote app settings
- Notification for when long running GitHub actions complete

### Changed
- Functions/App Setting tree items replaced with a "Learn How" node if build doesn't contain functions
- `Create New Static Web App` wizard now asks for deployment method
- Completed GitHub actions cannot be cancelled, on-going actions cannot be re-run
- Messaging of prompts after static web app creation

### Fixed
- [Bugs fixed](https://github.com/microsoft/vscode-azurestaticwebapps/milestone/7?closed=1)


## 0.4.0 - 2020-09-21

### Added
- Support for Python and C# API endpoints

### Fixed
- [Bugs fixed](https://github.com/microsoft/vscode-azurestaticwebapps/milestone/4?closed=1)

## 0.3.0 - 2020-07-31

### Added
- Folder structure will be displayed for the app and api location steps when creating static web apps
- Display GitHub Actions under environments
    - Rerun and cancel actions
    - View individual jobs and their statuses
- Edit configuration file
- Show documentation from the Azure Static Web Apps (Preview) ribbon
- Delete environments

### Fixed
- [Bugs fixed](https://github.com/microsoft/vscode-azurestaticwebapps/milestone/2?closed=1)

## 0.2.0 - 2020-06-10

### Added
- Display Function triggers in tree
- `Open Repo in GitHub` context menu on Environment item

### Changed
- Visual Studio Code - Insiders is no longer a requirement
- Azure Functions extension is no longer a direct dependency
- Default value for application code location step changed from 'app' to '/'

### Fixed
- [Bugs fixed](https://github.com/microsoft/vscode-azurestaticwebapps/milestone/6?closed=1)

## 0.1.0 - 2020-05-18

### Added
- View, create, browse, and delete Azure Static Web Apps (Preview)
- View a static web app's environments
- Create JavaScript/TypeScript HTTP Functions
- View, add, edit, and delete Application Settings
