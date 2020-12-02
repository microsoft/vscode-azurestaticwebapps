# Change Log

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
