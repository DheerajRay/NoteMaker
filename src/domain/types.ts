export const PROJECT_VERSION = "notemaker.project.v1" as const;

export type ProjectVersion = typeof PROJECT_VERSION;

export type InstrumentId = "drum-kit" | "bass" | "keys" | "bells" | "pluck" | "pad";

export type InstrumentPreset = {
  id: InstrumentId;
  name: string;
  shortName: string;
  description: string;
  color: string;
  sounds: string[];
};

export type LoopRange = {
  startStep: number;
  endStep: number;
  enabled: boolean;
};

export type StepEvent = {
  step: number;
  sound: string;
  velocity: number;
  durationSteps: number;
  probability?: number;
};

export type PatternClip = {
  id: string;
  trackId: string;
  startStep: number;
  lengthSteps: number;
  repeat: number;
  events: StepEvent[];
};

export type InstrumentTrack = {
  id: string;
  name: string;
  instrumentId: InstrumentId;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
};

export type Project = {
  version: ProjectVersion;
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  tempo: number;
  steps: number;
  loop: LoopRange;
  tracks: InstrumentTrack[];
  clips: PatternClip[];
};

export type ScheduledEvent = {
  clipId: string;
  trackId: string;
  instrumentId: InstrumentId;
  sound: string;
  step: number;
  durationSteps: number;
  velocity: number;
};
