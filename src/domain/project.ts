import { STARTER_SOUNDS } from "./starterSounds";
import { PROJECT_VERSION, type ParamMode, type Pattern, type PatternStep, type Project, type SampleAsset, type SoundSlot } from "./types";

const STORAGE_KEY = "notemaker.po33.v1.current";
const SLOT_COUNT = 16;
const PATTERN_COUNT = 16;
const STEPS_PER_PATTERN = 16;

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
    chain: { patternIds: [1] }
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
  return {
    ...createDefaultProject(),
    ...parsed,
    tempo: clamp(Math.round(parsed.tempo ?? 112), 60, 240),
    activePatternId: clamp(Math.round(parsed.activePatternId ?? 1), 1, PATTERN_COUNT),
    activeSlotId: clamp(Math.round(parsed.activeSlotId ?? 1), 1, SLOT_COUNT),
    paramMode: normalizeParamMode(parsed.paramMode),
    slots: parsed.slots.map(normalizeSlot).slice(0, SLOT_COUNT),
    patterns: parsed.patterns.map(normalizePattern).slice(0, PATTERN_COUNT),
    chain: parsed.chain?.patternIds?.length ? parsed.chain : { patternIds: [parsed.activePatternId ?? 1] }
  };
}

export function toggleStepTrigger(project: Project, stepIndex: number, slotId: number, keyIndex: number): Project {
  const safeStep = clamp(Math.round(stepIndex), 0, STEPS_PER_PATTERN - 1);
  const safeSlotId = clamp(Math.round(slotId), 1, SLOT_COUNT);
  const safeKeyIndex = clamp(Math.round(keyIndex), 1, SLOT_COUNT);
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
  return touch({ ...project, activeSlotId: clamp(Math.round(slotId), 1, SLOT_COUNT) });
}

export function selectPattern(project: Project, patternId: number): Project {
  return touch({ ...project, activePatternId: clamp(Math.round(patternId), 1, PATTERN_COUNT) });
}

export function setProjectTempo(project: Project, tempo: number): Project {
  return touch({ ...project, tempo: clamp(Math.round(tempo), 60, 240) });
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
  return {
    id: definition.id,
    type: definition.type,
    name: definition.name,
    sample: definition.sample,
    trimStart: 0,
    trimEnd: 1,
    gain: definition.type === "drum" ? 1 : 0.88,
    pitch: 0,
    filter: 1,
    resonance: 0,
    slices: definition.type === "drum" ? createSlices() : []
  };
}

function createPattern(id: number): Pattern {
  return {
    id,
    steps: Array.from({ length: STEPS_PER_PATTERN }, (_, index) => ({ index, triggers: [] }))
  };
}

function createSlices() {
  return Array.from({ length: SLOT_COUNT }, (_, index) => ({
    keyIndex: index + 1,
    trimStart: index / SLOT_COUNT,
    trimEnd: (index + 1) / SLOT_COUNT
  }));
}

function normalizeSlot(slot: SoundSlot): SoundSlot {
  const fallback = createSlot(STARTER_SOUNDS[clamp((slot.id ?? 1) - 1, 0, SLOT_COUNT - 1)]);
  return {
    ...fallback,
    ...slot,
    id: clamp(Math.round(slot.id ?? fallback.id), 1, SLOT_COUNT),
    type: slot.type === "drum" ? "drum" : "melodic",
    trimStart: clamp(slot.trimStart ?? fallback.trimStart, 0, 1),
    trimEnd: clamp(slot.trimEnd ?? fallback.trimEnd, 0, 1),
    gain: clamp(slot.gain ?? fallback.gain, 0, 1.5),
    pitch: clamp(slot.pitch ?? fallback.pitch, -24, 24),
    filter: clamp(slot.filter ?? fallback.filter, 0, 1),
    resonance: clamp(slot.resonance ?? fallback.resonance, 0, 1),
    slices: Array.isArray(slot.slices) ? slot.slices : fallback.slices
  };
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
