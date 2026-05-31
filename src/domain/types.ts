export const PROJECT_VERSION = "notemaker.po33.v1" as const;

export type ProjectVersion = typeof PROJECT_VERSION;

export type SlotType = "melodic" | "drum";

export type ParamMode = "trim" | "tone" | "filter";

export type SampleSourceType = "starter" | "imported";

export type SampleAsset = {
  id: string;
  name: string;
  sourceType: SampleSourceType;
  durationSeconds: number;
  url?: string;
  originalFileName?: string;
};

export type SliceSetting = {
  keyIndex: number;
  trimStart: number;
  trimEnd: number;
};

export type SoundSlot = {
  id: number;
  type: SlotType;
  name: string;
  sample: SampleAsset | null;
  trimStart: number;
  trimEnd: number;
  gain: number;
  pitch: number;
  filter: number;
  resonance: number;
  slices: SliceSetting[];
};

export type StepTrigger = {
  slotId: number;
  keyIndex: number;
  velocity: number;
  probability?: number;
};

export type LockedParams = Partial<Pick<SoundSlot, "trimStart" | "trimEnd" | "gain" | "pitch" | "filter" | "resonance">>;

export type PatternStep = {
  index: number;
  triggers: StepTrigger[];
  lockedParams?: Record<number, LockedParams>;
  fx?: string;
};

export type Pattern = {
  id: number;
  steps: PatternStep[];
};

export type PatternChain = {
  patternIds: number[];
};

export type Project = {
  version: ProjectVersion;
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  tempo: number;
  activePatternId: number;
  activeSlotId: number;
  writeMode: boolean;
  paramMode: ParamMode;
  memoryLimitSeconds: number;
  slots: SoundSlot[];
  patterns: Pattern[];
  chain: PatternChain;
};
