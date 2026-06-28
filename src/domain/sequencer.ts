import type { Project } from "./types";
import { drumVariationForKey, playbackRateForDrumKey, playbackRateForKey } from "../audio/music";
import type { SlotType } from "./types";

export const STEPS_PER_PATTERN = 16;
export const STEPS_PER_BAR = 4;
export const TIMING_TICKS_PER_STEP = 6;

export type SchedulePlanEntry = {
  patternId: number;
  stepIndex: number;
  slotId: number;
  keyIndex: number;
  sampleId: string;
  sampleName: string;
  slotType: SlotType;
  toneTime: string;
  seconds: number;
  scheduledSeconds: number;
  timingOffsetTicks: number;
  timingOffsetSeconds: number;
  durationSeconds: number;
  durationScale: number;
  trimStart: number;
  trimEnd: number;
  gain: number;
  playbackRate: number;
  filter: number;
  resonance: number;
  chokeTargets: number[];
  arrangementClipId?: string;
  laneId?: string;
  repeatBar?: number;
};

export function stepToToneTime(step: number): string {
  const bar = Math.floor(step / STEPS_PER_PATTERN);
  const stepInBar = step % STEPS_PER_PATTERN;
  const beat = Math.floor(stepInBar / STEPS_PER_BAR);
  const sixteenth = stepInBar % STEPS_PER_BAR;
  return `${bar}:${beat}:${sixteenth}`;
}

export function stepToSeconds(step: number, tempo: number): number {
  const secondsPerStep = 60 / tempo / 4;
  return step * secondsPerStep;
}

export function timingOffsetTicksToSeconds(timingOffsetTicks: number, tempo: number): number {
  const secondsPerStep = 60 / tempo / 4;
  return (Math.round(timingOffsetTicks) / TIMING_TICKS_PER_STEP) * secondsPerStep;
}

export function createSchedulePlan(project: Project): SchedulePlanEntry[] {
  const pattern = project.patterns.find((candidate) => candidate.id === project.activePatternId);
  if (!pattern) return [];

  return planPatternEntries(project, pattern, 0, 0, {}).sort(compareEntries);
}

export function createArrangementSchedulePlan(project: Project): SchedulePlanEntry[] {
  const arrangement = project.arrangement;
  if (!arrangement) return [];
  const lanes = new Map(arrangement.lanes.map((lane) => [lane.id, lane]));

  return arrangement.clips.flatMap((clip) => {
    const lane = lanes.get(clip.laneId);
    const pattern = project.patterns.find((candidate) => candidate.id === clip.patternId);
    if (!lane || lane.muted || clip.muted || !pattern) return [];
    const lengthBars = Math.max(Math.round(clip.lengthBars), 1);
    return Array.from({ length: lengthBars }, (_, repeatBar) =>
      planPatternEntries(project, pattern, clip.startBar + repeatBar, repeatBar, {
        arrangementClipId: clip.id,
        laneId: lane.id
      })
    ).flat();
  }).sort(compareEntries);
}

function planPatternEntries(
  project: Project,
  pattern: Project["patterns"][number],
  startBar: number,
  repeatBar: number,
  metadata: Pick<SchedulePlanEntry, "arrangementClipId" | "laneId">
): SchedulePlanEntry[] {
  const startStep = startBar * STEPS_PER_PATTERN;
  return pattern.steps.flatMap((step) =>
    step.triggers.flatMap((trigger) => {
      const slot = project.slots.find((candidate) => candidate.id === trigger.slotId);
      if (!slot?.sample) return [];
      const trimSpan = Math.max(slot.trimEnd - slot.trimStart, 0.01);
      const drumVariation = slot.type === "drum" ? drumVariationForKey(trigger.keyIndex) : null;
      const absoluteStep = startStep + step.index;
      const seconds = stepToSeconds(absoluteStep, project.tempo);
      const timingOffsetTicks = step.timingOffsetTicks ?? 0;
      const timingOffsetSeconds = timingOffsetTicksToSeconds(timingOffsetTicks, project.tempo);
      return {
        ...metadata,
        patternId: pattern.id,
        stepIndex: step.index,
        repeatBar,
        slotId: slot.id,
        keyIndex: trigger.keyIndex,
        sampleId: slot.sample.id,
        sampleName: slot.sample.name,
        slotType: slot.type,
        toneTime: stepToToneTime(step.index),
        seconds,
        scheduledSeconds: Math.max(seconds + timingOffsetSeconds, 0),
        timingOffsetTicks,
        timingOffsetSeconds,
        durationSeconds: Math.max(slot.sample.durationSeconds * trimSpan * (drumVariation?.durationScale ?? 1), 0.05),
        durationScale: drumVariation?.durationScale ?? 1,
        trimStart: slot.trimStart,
        trimEnd: slot.trimEnd,
        gain: slot.gain * trigger.velocity * (slot.sample.gainCompensation ?? 1) * (drumVariation?.gainScale ?? 1),
        playbackRate: slot.type === "melodic"
          ? playbackRateForKey(trigger.keyIndex, slot.sample.rootMidi ?? 60, slot.pitch)
          : playbackRateForDrumKey(trigger.keyIndex, slot.id, slot.pitch),
        filter: clamp(slot.filter * (drumVariation?.filterScale ?? 1), 0, 1),
        resonance: slot.resonance,
        chokeTargets: slot.sample.chokeTargets ?? []
      };
    })
  );
}

function compareEntries(a: SchedulePlanEntry, b: SchedulePlanEntry): number {
  return a.scheduledSeconds - b.scheduledSeconds || a.stepIndex - b.stepIndex || a.slotId - b.slotId || a.keyIndex - b.keyIndex;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
