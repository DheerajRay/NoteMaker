import { STARTER_SOUNDS } from "./starterSounds";
import {
  PROJECT_VERSION,
  type Arrangement,
  type ArrangementClip,
  type ArrangementLane,
  type ArrangementLaneId,
  type ParamMode,
  type Pattern,
  type PatternStep,
  type Project,
  type SampleAsset,
  type SoundSlot
} from "./types";

const STORAGE_KEY = "notemaker.po33.v1.current";
const SLOT_COUNT = 48;
const PERFORMANCE_KEY_COUNT = 16;
const PATTERN_COUNT = 16;
const STEPS_PER_PATTERN = 16;
const MIN_TIMING_OFFSET_TICKS = -3;
const MAX_TIMING_OFFSET_TICKS = 3;
const DEFAULT_ARRANGEMENT_LANES: ArrangementLane[] = [
  { id: "drums", name: "Drums", muted: false },
  { id: "bass", name: "Bass", muted: false },
  { id: "melody", name: "Melody", muted: false },
  { id: "texture", name: "Texture", muted: false }
];
const DEFAULT_SONG_LENGTH_BARS = 16;

export function createDefaultProject(): Project {
  const now = new Date().toISOString();

  return {
    version: PROJECT_VERSION,
    id: createId("project"),
    title: "PO33 Session",
    createdAt: now,
    updatedAt: now,
    tempo: 112,
    activePatternId: 1,
    activeSlotId: 1,
    writeMode: false,
    paramMode: "trim",
    memoryLimitSeconds: 40,
    slots: STARTER_SOUNDS.map(createSlot),
    patterns: Array.from({ length: PATTERN_COUNT }, (_, index) => createPattern(index + 1)),
    chain: { patternIds: [1] },
    arrangement: createArrangement()
  };
}

export function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function serializeProject(project: Project): string {
  return JSON.stringify({ ...project, updatedAt: new Date().toISOString() }, null, 2);
}

export function parseProject(source: string): Project {
  const parsed = JSON.parse(source) as Partial<Project>;
  if (parsed.version !== PROJECT_VERSION) {
    throw new Error("Unsupported NoteMaker project version");
  }
  if (!Array.isArray(parsed.slots) || !Array.isArray(parsed.patterns)) {
    throw new Error("Invalid NoteMaker project document");
  }
  const slots = normalizeSlots(parsed.slots);
  const activeSlotId = clamp(Math.round(parsed.activeSlotId ?? 1), 1, SLOT_COUNT);
  const activeSlot = slots.find((slot) => slot.id === activeSlotId);
  return {
    ...createDefaultProject(),
    ...parsed,
    tempo: clamp(Math.round(parsed.tempo ?? 112), 60, 240),
    activePatternId: clamp(Math.round(parsed.activePatternId ?? 1), 1, PATTERN_COUNT),
    activeSlotId: activeSlot?.sample ? activeSlotId : 1,
    paramMode: normalizeParamMode(parsed.paramMode),
    slots,
    patterns: parsed.patterns.map(normalizePattern).slice(0, PATTERN_COUNT),
    chain: parsed.chain?.patternIds?.length ? parsed.chain : { patternIds: [parsed.activePatternId ?? 1] },
    arrangement: normalizeArrangement(parsed.arrangement)
  };
}

export function toggleStepTrigger(project: Project, stepIndex: number, slotId: number, keyIndex: number): Project {
  const safeStep = clamp(Math.round(stepIndex), 0, STEPS_PER_PATTERN - 1);
  const safeSlotId = clamp(Math.round(slotId), 1, SLOT_COUNT);
  const safeKeyIndex = clamp(Math.round(keyIndex), 1, PERFORMANCE_KEY_COUNT);
  const slot = project.slots.find((candidate) => candidate.id === safeSlotId);
  if (!slot?.sample) return project;
  const patternIndex = project.patterns.findIndex((pattern) => pattern.id === project.activePatternId);
  if (patternIndex < 0) return project;

  const patterns = project.patterns.map((pattern, index) => {
    if (index !== patternIndex) return pattern;
    return {
      ...pattern,
      steps: pattern.steps.map((step) => {
        if (step.index !== safeStep) return step;
        const exists = step.triggers.some((trigger) => trigger.slotId === safeSlotId && trigger.keyIndex === safeKeyIndex);
        return {
          ...step,
          triggers: exists
            ? step.triggers.filter((trigger) => trigger.slotId !== safeSlotId || trigger.keyIndex !== safeKeyIndex)
            : [...step.triggers, { slotId: safeSlotId, keyIndex: safeKeyIndex, velocity: 0.85 }]
        };
      })
    };
  });

  return touch({ ...project, patterns });
}

export function removeStepTrigger(project: Project, stepIndex: number, slotId: number, keyIndex: number): Project {
  const safeStep = clamp(Math.round(stepIndex), 0, STEPS_PER_PATTERN - 1);
  const safeSlotId = clamp(Math.round(slotId), 1, SLOT_COUNT);
  const safeKeyIndex = clamp(Math.round(keyIndex), 1, PERFORMANCE_KEY_COUNT);
  const patternIndex = project.patterns.findIndex((pattern) => pattern.id === project.activePatternId);
  if (patternIndex < 0) return project;

  let removed = false;
  const patterns = project.patterns.map((pattern, index) => {
    if (index !== patternIndex) return pattern;
    return {
      ...pattern,
      steps: pattern.steps.map((step) => {
        if (step.index !== safeStep) return step;
        const triggers = step.triggers.filter((trigger) => {
          const shouldRemove = trigger.slotId === safeSlotId && trigger.keyIndex === safeKeyIndex;
          if (shouldRemove) removed = true;
          return !shouldRemove;
        });
        return { ...step, triggers };
      })
    };
  });

  return removed ? touch({ ...project, patterns }) : project;
}

export function adjustStepTimingOffset(project: Project, stepIndex: number, deltaTicks: number): Project {
  const safeStep = clamp(Math.round(stepIndex), 0, STEPS_PER_PATTERN - 1);
  const safeDelta = Math.round(deltaTicks);
  const patternIndex = project.patterns.findIndex((pattern) => pattern.id === project.activePatternId);
  if (patternIndex < 0 || safeDelta === 0) return project;

  const patterns = project.patterns.map((pattern, index) => {
    if (index !== patternIndex) return pattern;
    return {
      ...pattern,
      steps: pattern.steps.map((step) =>
        step.index === safeStep
          ? {
              ...step,
              timingOffsetTicks: clamp((step.timingOffsetTicks ?? 0) + safeDelta, MIN_TIMING_OFFSET_TICKS, MAX_TIMING_OFFSET_TICKS)
            }
          : step
      )
    };
  });

  return touch({ ...project, patterns });
}

export function updateSlotParams(project: Project, slotId: number, params: Partial<Pick<SoundSlot, "trimStart" | "trimEnd" | "gain" | "pitch" | "filter" | "resonance">>): Project {
  const slots = project.slots.map((slot) => {
    if (slot.id !== slotId) return slot;
    const trimStart = clamp(params.trimStart ?? slot.trimStart, 0, 1);
    const trimEnd = clamp(params.trimEnd ?? slot.trimEnd, 0, 1);
    return {
      ...slot,
      trimStart: Math.min(trimStart, trimEnd),
      trimEnd: Math.max(trimStart, trimEnd),
      gain: clamp(params.gain ?? slot.gain, 0, 1.5),
      pitch: clamp(params.pitch ?? slot.pitch, -24, 24),
      filter: clamp(params.filter ?? slot.filter, 0, 1),
      resonance: clamp(params.resonance ?? slot.resonance, 0, 1)
    };
  });
  return touch({ ...project, slots });
}

export function replaceSlotSample(project: Project, slotId: number, sample: SampleAsset): Project {
  return touch({
    ...project,
    slots: project.slots.map((slot) =>
      slot.id === slotId ? { ...slot, name: sample.name, sample, trimStart: 0, trimEnd: 1 } : slot
    )
  });
}

export function selectSlot(project: Project, slotId: number): Project {
  const safeSlotId = clamp(Math.round(slotId), 1, SLOT_COUNT);
  const slot = project.slots.find((candidate) => candidate.id === safeSlotId);
  return slot?.sample ? touch({ ...project, activeSlotId: safeSlotId }) : project;
}

export function selectPattern(project: Project, patternId: number): Project {
  return touch({ ...project, activePatternId: clamp(Math.round(patternId), 1, PATTERN_COUNT) });
}

export function setProjectTempo(project: Project, tempo: number): Project {
  return touch({ ...project, tempo: clamp(Math.round(tempo), 60, 240) });
}

export function addArrangementClip(project: Project, patternId: number, laneId: ArrangementLaneId, startBar: number): Project {
  const pattern = project.patterns.find((candidate) => candidate.id === patternId);
  const lane = project.arrangement.lanes.find((candidate) => candidate.id === laneId);
  if (!pattern || !lane) return project;
  const safeStartBar = clamp(Math.round(startBar), 0, project.arrangement.songLengthBars - 1);
  const clip: ArrangementClip = {
    id: createId("clip"),
    patternId: pattern.id,
    laneId: lane.id,
    startBar: safeStartBar,
    lengthBars: 1,
    muted: false
  };
  return touch({
    ...project,
    arrangement: {
      ...project.arrangement,
      clips: [...project.arrangement.clips, clip]
    }
  });
}

export function moveArrangementClip(project: Project, clipId: string, laneId: ArrangementLaneId, startBar: number): Project {
  const lane = project.arrangement.lanes.find((candidate) => candidate.id === laneId);
  if (!lane) return project;
  return touch({
    ...project,
    arrangement: {
      ...project.arrangement,
      clips: project.arrangement.clips.map((clip) =>
        clip.id === clipId
          ? { ...clip, laneId, startBar: clamp(Math.round(startBar), 0, project.arrangement.songLengthBars - 1) }
          : clip
      )
    }
  });
}

export function resizeArrangementClip(project: Project, clipId: string, deltaBars: number): Project {
  return touch({
    ...project,
    arrangement: {
      ...project.arrangement,
      clips: project.arrangement.clips.map((clip) => {
        if (clip.id !== clipId) return clip;
        const maxLength = project.arrangement.songLengthBars - clip.startBar;
        return { ...clip, lengthBars: clamp(Math.round(clip.lengthBars + deltaBars), 1, Math.max(maxLength, 1)) };
      })
    }
  });
}

export function toggleArrangementClipMute(project: Project, clipId: string): Project {
  return touch({
    ...project,
    arrangement: {
      ...project.arrangement,
      clips: project.arrangement.clips.map((clip) => (clip.id === clipId ? { ...clip, muted: !clip.muted } : clip))
    }
  });
}

export function toggleArrangementLaneMute(project: Project, laneId: ArrangementLaneId): Project {
  return touch({
    ...project,
    arrangement: {
      ...project.arrangement,
      lanes: project.arrangement.lanes.map((lane) => (lane.id === laneId ? { ...lane, muted: !lane.muted } : lane))
    }
  });
}

export function resetArrangement(project: Project): Project {
  return touch({
    ...project,
    arrangement: createArrangement()
  });
}

export function loadDemoArrangement(project: Project): Project {
  return touch({
    ...project,
    arrangement: {
      ...createArrangement(),
      clips: [
        { id: "demo-drums", patternId: 1, laneId: "drums", startBar: 0, lengthBars: 4, muted: false },
        { id: "demo-bass", patternId: 2, laneId: "bass", startBar: 0, lengthBars: 4, muted: false },
        { id: "demo-melody", patternId: 3, laneId: "melody", startBar: 4, lengthBars: 4, muted: false },
        { id: "demo-texture", patternId: 4, laneId: "texture", startBar: 8, lengthBars: 4, muted: false }
      ]
    }
  });
}

export function saveProjectToStorage(project: Project): void {
  window.localStorage.setItem(STORAGE_KEY, serializeProject(project));
}

export function loadProjectFromStorage(): Project | null {
  const source = window.localStorage.getItem(STORAGE_KEY);
  if (!source) return null;
  try {
    return parseProject(source);
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function downloadProject(project: Project): void {
  const blob = new Blob([serializeProject(project)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.notemaker.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function createSlot(definition: (typeof STARTER_SOUNDS)[number]): SoundSlot {
  const defaultParams = definition.defaultParams ?? {
    trimStart: 0,
    trimEnd: 1,
    gain: definition.type === "drum" ? 1 : 0.88,
    pitch: 0,
    filter: 1,
    resonance: 0
  };
  return {
    id: definition.id,
    type: definition.type,
    name: definition.name,
    sample: definition.sample,
    isPlaceholder: definition.isPlaceholder,
    character: definition.character,
    trimStart: defaultParams.trimStart,
    trimEnd: defaultParams.trimEnd,
    gain: defaultParams.gain,
    pitch: defaultParams.pitch,
    filter: defaultParams.filter,
    resonance: defaultParams.resonance,
    slices: definition.type === "drum" ? createSlices() : []
  };
}

function createPattern(id: number): Pattern {
  return {
    id,
    steps: Array.from({ length: STEPS_PER_PATTERN }, (_, index) => ({ index, triggers: [], timingOffsetTicks: 0 }))
  };
}

function createArrangement(): Arrangement {
  return {
    lanes: DEFAULT_ARRANGEMENT_LANES.map((lane) => ({ ...lane })),
    clips: [],
    songLengthBars: DEFAULT_SONG_LENGTH_BARS
  };
}

function createSlices() {
  return Array.from({ length: PERFORMANCE_KEY_COUNT }, (_, index) => ({
    keyIndex: index + 1,
    trimStart: index / PERFORMANCE_KEY_COUNT,
    trimEnd: (index + 1) / PERFORMANCE_KEY_COUNT
  }));
}

function normalizeSlots(slots: SoundSlot[] | undefined): SoundSlot[] {
  return STARTER_SOUNDS.map((definition) => {
    const saved = slots?.find((slot) => slot.id === definition.id);
    return saved ? normalizeSlot(saved) : createSlot(definition);
  });
}

function normalizeSlot(slot: SoundSlot): SoundSlot {
  const fallback = createSlot(STARTER_SOUNDS[clamp((slot.id ?? 1) - 1, 0, SLOT_COUNT - 1)]);
  const importedSampleDisabled = slot.sample?.sourceType === "imported";
  const sample = !importedSampleDisabled && slot.sample && fallback.sample
    ? { ...fallback.sample, ...slot.sample }
    : fallback.sample;
  return {
    ...fallback,
    ...slot,
    sample,
    isPlaceholder: fallback.isPlaceholder,
    character: fallback.character,
    name: importedSampleDisabled || fallback.isPlaceholder ? fallback.name : slot.name ?? fallback.name,
    id: clamp(Math.round(slot.id ?? fallback.id), 1, SLOT_COUNT),
    type: fallback.type,
    trimStart: clamp(slot.trimStart ?? fallback.trimStart, 0, 1),
    trimEnd: clamp(slot.trimEnd ?? fallback.trimEnd, 0, 1),
    gain: clamp(slot.gain ?? fallback.gain, 0, 1.5),
    pitch: clamp(slot.pitch ?? fallback.pitch, -24, 24),
    filter: clamp(slot.filter ?? fallback.filter, 0, 1),
    resonance: clamp(slot.resonance ?? fallback.resonance, 0, 1),
    slices: Array.isArray(slot.slices) ? slot.slices : fallback.slices
  };
}

function normalizeArrangement(arrangement: Partial<Arrangement> | undefined): Arrangement {
  const fallback = createArrangement();
  const lanes = DEFAULT_ARRANGEMENT_LANES.map((lane) => {
    const saved = arrangement?.lanes?.find((candidate) => candidate.id === lane.id);
    return { ...lane, muted: Boolean(saved?.muted) };
  });
  const songLengthBars = clamp(Math.round(arrangement?.songLengthBars ?? DEFAULT_SONG_LENGTH_BARS), 1, 128);
  const laneIds = new Set(lanes.map((lane) => lane.id));
  const clips = Array.isArray(arrangement?.clips)
    ? arrangement.clips.flatMap((clip) => {
        if (!laneIds.has(clip.laneId) || !Number.isFinite(clip.patternId)) return [];
        const startBar = clamp(Math.round(clip.startBar ?? 0), 0, songLengthBars - 1);
        const maxLength = Math.max(songLengthBars - startBar, 1);
        return [{
          id: typeof clip.id === "string" && clip.id ? clip.id : createId("clip"),
          patternId: clamp(Math.round(clip.patternId), 1, PATTERN_COUNT),
          laneId: clip.laneId,
          startBar,
          lengthBars: clamp(Math.round(clip.lengthBars ?? 1), 1, maxLength),
          muted: Boolean(clip.muted)
        }];
      })
    : fallback.clips;
  return { lanes, clips, songLengthBars };
}

function normalizePattern(pattern: Pattern): Pattern {
  const fallback = createPattern(clamp(Math.round(pattern.id ?? 1), 1, PATTERN_COUNT));
  return {
    ...fallback,
    ...pattern,
    id: clamp(Math.round(pattern.id ?? fallback.id), 1, PATTERN_COUNT),
    steps: normalizeSteps(pattern.steps ?? [])
  };
}

function normalizeSteps(steps: PatternStep[]): PatternStep[] {
  return Array.from({ length: STEPS_PER_PATTERN }, (_, index) => {
    const step = steps.find((candidate) => candidate.index === index);
    return {
      index,
      triggers: Array.isArray(step?.triggers) ? step.triggers : [],
      timingOffsetTicks: clamp(Math.round(step?.timingOffsetTicks ?? 0), MIN_TIMING_OFFSET_TICKS, MAX_TIMING_OFFSET_TICKS),
      lockedParams: step?.lockedParams,
      fx: step?.fx
    };
  });
}

function normalizeParamMode(mode: ParamMode | undefined): ParamMode {
  return mode === "tone" || mode === "filter" ? mode : "trim";
}

function touch(project: Project): Project {
  return { ...project, updatedAt: new Date().toISOString() };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
