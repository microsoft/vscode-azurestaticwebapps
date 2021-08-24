import { buildPresets } from "../buildPresets/buildPresets";
import { IQuickstartTemplate } from "./IQuickstartTemplate";

export const quickstartTemplates: IQuickstartTemplate[] = [
    {
        displayName: 'Angular',
        buildPreset: {
            ...buildPresets.angular,
            outputLocation: 'dist/angular-basic'
        },
        gitUrl: 'https://github.com/staticwebdev/angular-basic'
    },
    {
        displayName: 'React',
        gitUrl: 'https://github.com/staticwebdev/react-basic',
        buildPreset: buildPresets.react
    },
    {
        displayName: 'Vanilla JavaScript',
        buildPreset: {
            outputLocation: 'build',
            appLocation: '/',
            apiLocation: '',
            displayName: 'vanilla'
        },
        gitUrl: 'https://github.com/staticwebdev/vanilla-basic'
    },
    {
        displayName: 'Vue',
        buildPreset: buildPresets.vuejs,
        gitUrl: 'https://github.com/staticwebdev/vue-basic'
    }
]
