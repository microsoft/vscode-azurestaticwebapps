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

export const configFileName: string = 'staticwebapp.config.json';

export const showActionsMsg: MessageItem = { title: localize('openActions', 'Open Actions in GitHub') };

export const onlyGitHubSupported: string = localize('onlyGitHubSupported', 'Only Static Web Apps linked to GitHub are supported at this time.');

export const isStartGroup = (t: string): boolean => /##\[group\]/.test(t);
export const isEndGroup = (t: string): boolean => /##\[endgroup\]/.test(t)

// Source: https://github.com/github/gitignore/blob/master/Node.gitignore
export const defaultGitignoreContents: string = `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Diagnostic reports (https://nodejs.org/api/report.html)
report.[0-9]*.[0-9]*.[0-9]*.[0-9]*.json

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Directory for instrumented libs generated by jscoverage/JSCover
lib-cov

# Coverage directory used by tools like istanbul
coverage
*.lcov

# nyc test coverage
.nyc_output

# Grunt intermediate storage (https://gruntjs.com/creating-plugins#storing-task-files)
.grunt

# Bower dependency directory (https://bower.io/)
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons (https://nodejs.org/api/addons.html)
build/Release

# Dependency directories
node_modules/
jspm_packages/

# Snowpack dependency directory (https://snowpack.dev/)
web_modules/

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.test

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next
out

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
# Comment in the public line in if your project uses Gatsby and not Next.js
# https://nextjs.org/blog/next-9-1#public-directory-support
# public

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless/

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# yarn v2
.yarn/cache
.yarn/unplugged
.yarn/build-state.yml
.yarn/install-state.gz
.pnp.*`;
