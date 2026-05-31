import { create } from "zustand";
import {
  createDefaultProject,
  createId,
  loadProjectFromStorage,
  replaceSlotSample,
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
  setTempo: (tempo: number) => void;
  setParamMode: (mode: ParamMode) => void;
  setKnobValue: (knob: "a" | "b", value: number) => void;
  importSampleFile: (file: File | undefined) => void;
  importProject: (project: Project) => void;
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

  importSampleFile: (file) => {
    if (!file) return;
    const { project } = get();
    if (!file.type.startsWith("audio/")) {
      set({ importError: "Choose an audio file for this slot." });
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const name = file.name.replace(/\.[^.]+$/, "") || "Imported Sound";
    const next = replaceSlotSample(project, project.activeSlotId, {
      id: createId("sample"),
      name,
      sourceType: "imported",
      durationSeconds: 1,
      url: objectUrl,
      originalFileName: file.name
    });
    saveProjectToStorage(next);
    set({ project: next, importError: null });
  },

  importProject: (project) => {
    saveProjectToStorage(project);
    set({ project, importError: null });
  },

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
