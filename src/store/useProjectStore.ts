import { create } from "zustand";
import { createStarterEvents } from "../domain/instruments";
import { createDefaultProject, createId, loadProjectFromStorage, saveProjectToStorage } from "../domain/project";
import { quantizeStep } from "../domain/sequencer";
import type { InstrumentId, PatternClip, Project } from "../domain/types";

type ProjectState = {
  project: Project;
  selectedInstrumentId: InstrumentId;
  setSelectedInstrument: (instrumentId: InstrumentId) => void;
  setTempo: (tempo: number) => void;
  setLoopEnabled: (enabled: boolean) => void;
  setLoopRange: (startStep: number, endStep: number) => void;
  addClip: (trackId: string, instrumentId: InstrumentId, startStep: number) => void;
  moveClip: (clipId: string, trackId: string, startStep: number) => void;
  resizeClip: (clipId: string, deltaSteps: number) => void;
  duplicateClip: (clipId: string) => void;
  removeClip: (clipId: string) => void;
  toggleRepeat: (clipId: string) => void;
  toggleMute: (trackId: string) => void;
  toggleSolo: (trackId: string) => void;
  importProject: (project: Project) => void;
  resetProject: () => void;
};

const loadedProject = typeof window !== "undefined" ? loadProjectFromStorage() : null;

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: loadedProject ?? createDefaultProject(),
  selectedInstrumentId: "drum-kit",

  setSelectedInstrument: (instrumentId) => set({ selectedInstrumentId: instrumentId }),

  setTempo: (tempo) =>
    updateProject(set, (project) => ({
      ...project,
      tempo: Math.min(Math.max(Math.round(tempo), 60), 180)
    })),

  setLoopEnabled: (enabled) =>
    updateProject(set, (project) => ({
      ...project,
      loop: { ...project.loop, enabled }
    })),

  setLoopRange: (startStep, endStep) =>
    updateProject(set, (project) => ({
      ...project,
      loop: {
        ...project.loop,
        startStep: quantizeStep(startStep, project.steps),
        endStep: Math.min(Math.max(endStep, startStep + 1), project.steps)
      }
    })),

  addClip: (trackId, instrumentId, startStep) =>
    updateProject(set, (project) => {
      const track = project.tracks.find((candidate) => candidate.id === trackId);
      const clipInstrument = track?.instrumentId ?? instrumentId;
      const clip: PatternClip = {
        id: createId("clip"),
        trackId,
        startStep: quantizeStep(startStep, project.steps),
        lengthSteps: clipInstrument === "pad" ? 8 : 4,
        repeat: 1,
        events: createStarterEvents(clipInstrument)
      };
      return { ...project, clips: [...project.clips, clip] };
    }),

  moveClip: (clipId, trackId, startStep) =>
    updateProject(set, (project) => ({
      ...project,
      clips: project.clips.map((clip) =>
        clip.id === clipId
          ? { ...clip, trackId, startStep: quantizeStep(startStep, project.steps) }
          : clip
      )
    })),

  resizeClip: (clipId, deltaSteps) =>
    updateProject(set, (project) => ({
      ...project,
      clips: project.clips.map((clip) =>
        clip.id === clipId
          ? { ...clip, lengthSteps: Math.min(Math.max(clip.lengthSteps + deltaSteps, 2), project.steps) }
          : clip
      )
    })),

  duplicateClip: (clipId) =>
    updateProject(set, (project) => {
      const source = project.clips.find((clip) => clip.id === clipId);
      if (!source) return project;
      return {
        ...project,
        clips: [
          ...project.clips,
          {
            ...source,
            id: createId("clip"),
            startStep: quantizeStep(source.startStep + source.lengthSteps, project.steps)
          }
        ]
      };
    }),

  removeClip: (clipId) =>
    updateProject(set, (project) => ({
      ...project,
      clips: project.clips.filter((clip) => clip.id !== clipId)
    })),

  toggleRepeat: (clipId) =>
    updateProject(set, (project) => ({
      ...project,
      clips: project.clips.map((clip) =>
        clip.id === clipId ? { ...clip, repeat: clip.repeat >= 4 ? 1 : clip.repeat + 1 } : clip
      )
    })),

  toggleMute: (trackId) =>
    updateProject(set, (project) => ({
      ...project,
      tracks: project.tracks.map((track) =>
        track.id === trackId ? { ...track, muted: !track.muted } : track
      )
    })),

  toggleSolo: (trackId) =>
    updateProject(set, (project) => ({
      ...project,
      tracks: project.tracks.map((track) =>
        track.id === trackId ? { ...track, solo: !track.solo } : track
      )
    })),

  importProject: (project) => {
    saveProjectToStorage(project);
    set({ project });
  },

  resetProject: () => {
    const project = createDefaultProject();
    saveProjectToStorage(project);
    set({ project, selectedInstrumentId: "drum-kit" });
  }
}));

function updateProject(set: (partial: Partial<ProjectState>) => void, updater: (project: Project) => Project) {
  const current = useProjectStore.getState().project;
  const next = { ...updater(current), updatedAt: new Date().toISOString() };
  saveProjectToStorage(next);
  set({ project: next });
}
