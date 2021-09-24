/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

// adapted from Oryx's C# implementation
// https://github.com/microsoft/Oryx/blob/main/src/Detector/Node/NodeConstants.cs

export namespace NodeConstants {
    export const PlatformName = "nodejs";
    export const NpmToolName = "npm";
    export const YarnToolName = "yarn";
    export const PackageJsonFileName = "package.json";
    export const PackageLockJsonFileName = "package-lock.json";
    export const YarnLockFileName = "yarn.lock";
    export const YarnrcYmlName = ".yarnrc.yml";
    export const HugoTomlFileName = "config.toml";
    export const HugoYamlFileName = "config.yaml";
    export const HugoJsonFileName = "config.json";
    export const LernaJsonFileName = "lerna.json";
    export const LageConfigJSFileName = "lage.config.js";
    export const HugoConfigFolderName = "config";
    export const NodeModulesDirName = "node_modules";
    export const NodeModulesToBeDeletedName = "_del_node_modules";
    export const NodeModulesZippedFileName = "node_modules.zip";
    export const NodeModulesTarGzFileName = "node_modules.tar.gz";
    export const NodeModulesFileBuildProperty = "compressedNodeModulesFile";
    export const FlutterYamlFileName = "pubspec.yaml";
    export const FlutterFrameworkeName = "Flutter";
    export const IisStartupFiles = [
        "default.htm",
        "default.html",
        "default.asp",
        "index.htm",
        "index.html",
        "iisstart.htm",
        "default.aspx",
        "index.php"
    ];

    export const TypicalNodeDetectionFiles = [
        "server.js",
        "app.js"
    ];

    export const DevDependencyFrameworkKeyWordToName = {
        "aurelia-cli": "Aurelia",
        "@11ty/eleventy": "Eleventy",
        "elm": "Elm",
        "ember-cli": "Ember",
        "@glimmer/component": "Glimmer",
        "hugo-cli": "Hugo",
        "@angular/cli": "Angular",
        "knockout": "KnockoutJs",
        "polymer-cli": "Polymer",
        "@stencil/core": "Stencil",
        "svelte": "Svelte",
        "typescript": "Typescript",
        "vuepress": "VuePress",
        "@vue/cli-service": "Vue.js"
    };

    export const DependencyFrameworkKeyWordToName = {
        "gatsby": "Gatsby",
        "gridsome": "Gridsome",
        "@ionic/angular": "Ionic Angular",
        "@ionic/react": "Ionic React",
        "jquery": "jQuery",
        "lit-element": "LitElement",
        "marko": "Marko",
        "express": "Express",
        "meteor-node-stubs": "Meteor",
        "mithril": "Mithril",
        "next": "Next.js",
        "react": "React",
        "nuxt": "Nuxt.js",
        "preact": "Preact",
        "@scullyio/init": "Scully",
        "three": "Three.js",
        "vue": "Vue.js"
    };

    export const srcFolderName = 'src';
}
