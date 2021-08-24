import { IBuildPreset } from "../buildPresets/IBuildPreset";

export interface IQuickstartTemplate {
    displayName: string;
    gitUrl: string;
    buildPreset: IBuildPreset;
}
