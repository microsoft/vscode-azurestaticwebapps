import { IBuildPreset } from "../buildPresets/IBuildPreset";

export interface ISampleTemplate {
    displayName: string;
    gitUrl: string;
    buildPreset: IBuildPreset;
}
