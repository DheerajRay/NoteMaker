import { createStarterEvents } from "./instruments";
import { PROJECT_VERSION, type InstrumentId, type InstrumentTrack, type PatternClip, type Project } from "./types";

const STORAGE_KEY = "notemaker.project.v1.current";

const TRACKS: Array<{ id: string; name: string; instrumentId: InstrumentId }> = [
  { id: "track-drums", name: "Pocket Drums", instrumentId: "drum-kit" },
  { id: "track-bass", name: "Sub Bass", instrumentId: "bass" },
  { id: "track-keys", name: "Mini Keys", instrumentId: "keys" },
  { id: "track-bells", name: "Glass Bells", instrumentId: "bells" },
  { id: "track-pluck", name: "Tape Pluck", instrumentId: "pluck" },
  { id: "track-pad", name: "Dust Pad", instrumentId: "pad" }
];

export function createDefaultProject(): Project {
  const now = new Date().toISOString();
  const tracks: InstrumentTrack[] = TRACKS.map((track) => ({
    ...track,
    volume: 0.82,
    pan: 0,
    muted: false,
    solo: false
  }));

  const clips: PatternClip[] = [
    {
      id: "clip-drums-1",
      trackId: "track-drums",
      startStep: 0,
      lengthSteps: 8,
      repeat: 4,
      events: createStarterEvents("drum-kit")
    },
    {
      id: "clip-bass-1",
      trackId: "track-bass",
      startStep: 0,
      lengthSteps: 8,
      repeat: 2,
      events: createStarterEvents("bass")
    },
    {
      id: "clip-bells-1",
      trackId: "track-bells",
      startStep: 8,
      lengthSteps: 8,
      repeat: 1,
      events: createStarterEvents("bells")
    }
  ];

  return {
    version: PROJECT_VERSION,
    id: createId("project"),
    title: "Pocket Session",
    createdAt: now,
    updatedAt: now,
    tempo: 112,
    steps: 32,
    loop: { startStep: 0, endStep: 32, enabled: true },
    tracks,
    clips
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
  if (!Array.isArray(parsed.tracks) || !Array.isArray(parsed.clips)) {
    throw new Error("Invalid NoteMaker project document");
  }
  return {
    ...parsed,
    tempo: parsed.tempo ?? 112,
    steps: parsed.steps ?? 32,
    loop: parsed.loop ?? { startStep: 0, endStep: parsed.steps ?? 32, enabled: true }
  } as Project;
}

export function saveProjectToStorage(project: Project): void {
  window.localStorage.setItem(STORAGE_KEY, serializeProject(project));
}

export function loadProjectFromStorage(): Project | null {
  const source = window.localStorage.getItem(STORAGE_KEY);
  if (!source) return null;
  return parseProject(source);
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
