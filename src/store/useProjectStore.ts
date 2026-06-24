import { create } from "zustand";
import {
  adjustStepTimingOffset,
  createDefaultProject,
  loadProjectFromStorage,
  removeStepTrigger,
  saveProjectToStorage,
  selectPattern,
  selectSlot,
  setProjectTempo,
  toggleStepTrigger,
  updateSlotParams
} from "../domain/project";
import type { ParamMode, Project } from "../domain/types";

type ProjectState = {
  project: Project;
  selectedKeyIndex: number;
  importError: string | null;
  selectSlot: (slotId: number) => void;
  selectPattern: (patternId: number) => void;
  setSelectedKey: (keyIndex: number) => void;
  toggleWriteMode: () => void;
  toggleStep: (stepIndex: number) => void;
  removeTrigger: (stepIndex: number, slotId: number, keyIndex: number) => void;
  adjustTimingOffset: (stepIndex: number, deltaTicks: number) => void;
  setTempo: (tempo: number) => void;
  setParamMode: (mode: ParamMode) => void;
  setKnobValue: (knob: "a" | "b", value: number) => void;
  importSampleFile: (file: File | undefined) => Promise<void>;
  importProject: (project: Project) => void;
  setImportError: (message: string | null) => void;
  resetProject: () => void;
};

const loadedProject = typeof window !== "undefined" ? loadProjectFromStorage() : null;

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: loadedProject ?? createDefaultProject(),
  selectedKeyIndex: 1,
  importError: null,

  selectSlot: (slotId) => updateProject(set, (project) => selectSlot(project, slotId)),

  selectPattern: (patternId) => updateProject(set, (project) => selectPattern(project, patternId)),

  setSelectedKey: (keyIndex) => set({ selectedKeyIndex: Math.min(Math.max(Math.round(keyIndex), 1), 16) }),

  toggleWriteMode: () =>
    updateProject(set, (project) => ({
      ...project,
      writeMode: !project.writeMode
    })),

  toggleStep: (stepIndex) => {
    const { project, selectedKeyIndex } = get();
    if (!project.writeMode) return;
    updateProject(set, () => toggleStepTrigger(project, stepIndex, project.activeSlotId, selectedKeyIndex));
  },

  removeTrigger: (stepIndex, slotId, keyIndex) => {
    const { project } = get();
    updateProject(set, () => removeStepTrigger(project, stepIndex, slotId, keyIndex));
  },

  adjustTimingOffset: (stepIndex, deltaTicks) => {
    const { project } = get();
    updateProject(set, () => adjustStepTimingOffset(project, stepIndex, deltaTicks));
  },

  setTempo: (tempo) => updateProject(set, (project) => setProjectTempo(project, tempo)),

  setParamMode: (mode) =>
    updateProject(set, (project) => ({
      ...project,
      paramMode: mode
    })),

  setKnobValue: (knob, value) => {
    const { project } = get();
    const slot = project.slots.find((candidate) => candidate.id === project.activeSlotId);
    if (!slot) return;
    const params =
      project.paramMode === "trim"
        ? knob === "a"
          ? { trimStart: value }
          : { trimEnd: value }
        : project.paramMode === "tone"
          ? knob === "a"
            ? { pitch: value }
            : { gain: value }
          : knob === "a"
            ? { filter: value }
            : { resonance: value };
    updateProject(set, () => updateSlotParams(project, slot.id, params));
  },

  importSampleFile: async (file) => {
    if (!file) return;
    set({ importError: "Sound import is paused while the sample workflow is redesigned." });
  },

  importProject: (project) => {
    saveProjectToStorage(project);
    set({ project, importError: null });
  },

  setImportError: (message) => set({ importError: message }),

  resetProject: () => {
    const project = createDefaultProject();
    saveProjectToStorage(project);
    set({ project, selectedKeyIndex: 1, importError: null });
  }
}));

function updateProject(set: (partial: Partial<ProjectState>) => void, updater: (project: Project) => Project) {
  const current = useProjectStore.getState().project;
  const next = updater(current);
  saveProjectToStorage(next);
  set({ project: next });
}
